/* ============================================================
   STAT! music engine — ORIGINAL tracks, synthesized live.
   No audio files, no licensing. Used by host AND phones.

   Songs:  lobby (waiting room groove), rush / counter / y2k / funk
           (game tracks, rotate by round), sudden, victory.
   Pressure 0-5: last 5 seconds of a question. Each level adds a
   clock tick, faster tempo, rising riser, heartbeat and louder mix.

   Browsers only allow sound after a real tap, so start() must be
   called from a click/tap (Join button, Open button, Music button).
   ============================================================ */
(function (root) {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, sched = null;
  var on = false, songKey = 'lobby', lastGame = 'rush', pressure = 0;
  var step = 0, nextTime = 0, riser = null, riserGain = null, riserFilt = null;
  var BASEVOL = 0.17, duckTo = 1;
  var LOG = root.__statMusicLog = root.__statMusicLog || [];

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // degree tokens relative to chord root:  r 3 5 6 7 o(octave) 9 t(oct+3rd) f(oct+5th)
  function deg(tok, q) {
    var m = q === 'm';
    return { r: 0, '3': m ? 3 : 4, '5': 7, '6': 9, '7': m ? 10 : 11, o: 12, '9': 14, t: 12 + (m ? 3 : 4), f: 19 }[tok];
  }
  var SONGS = {
    lobby:   { name: 'Waiting Room Groove', bpm: 104, lead: 'triangle', lv: 0.05,
               chords: [[65, 'M'], [62, 'm'], [58, 'M'], [60, 'M']],
               kick: 'x.......x.x.....', snare: '....x.......x...', hat: '..x...x...x...x.',
               bass: 'r...r.5.r...o.5.', mel: 'r.3.5.3.o.5.3.5.' },
    rush:    { name: 'Rush Hour Refill', bpm: 138, lead: 'sawtooth', lv: 0.028,
               chords: [[57, 'm'], [53, 'M'], [60, 'M'], [55, 'M']],
               kick: 'x..x..x.x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo',
               bass: 'r.r.r.r.5.5.o.5.', mel: 'o.5.o.9.o.5.3.5.' },
    counter: { name: 'Counter Rush', bpm: 132, lead: 'square', lv: 0.022,
               chords: [[60, 'M'], [55, 'M'], [57, 'm'], [53, 'M']],
               kick: 'x...x...x...x.x.', snare: '....x..x....x...', hat: 'xxxxxxxxxxxxxxxx',
               bass: 'r..r..5.r..o..5.', mel: 'o.t.f.t.o...9.t.' },
    y2k:     { name: 'Y2K Pop Rush', bpm: 140, lead: 'square', lv: 0.022,
               chords: [[62, 'M'], [57, 'M'], [59, 'm'], [55, 'M']],
               kick: 'x.....x.x...x...', snare: '....x.......x...', hat: 'x.xox.xox.xox.xo',
               bass: 'r.o.r.o.5.o.5.o.', mel: 'r35o53r.r35o5t5.' },
    funk:    { name: 'STAT Order Funk', bpm: 126, lead: 'sawtooth', lv: 0.026,
               chords: [[52, 'm'], [48, 'M'], [55, 'M'], [50, 'M']],
               kick: 'x..x....x.x.....', snare: '....x.......x..x', hat: 'x.xxx.xxx.xxx.xx',
               bass: 'r..r.o.r..5.3.5.', mel: '..o.9.t...o.9.5.' },
    sudden:  { name: 'Sudden Death', bpm: 168, lead: 'sawtooth', lv: 0.032,
               chords: [[57, 'm'], [53, 'M'], [60, 'M'], [55, 'M']],
               kick: 'x...x...x...x...', snare: '....x.......x.x.', hat: 'xxxxxxxxxxxxxxxx',
               bass: 'r.r.r.r.r.r.r.r.', mel: 'o5t5o5t5o5f5o5t5' },
    victory: { name: 'Victory Lap', bpm: 120, lead: 'triangle', lv: 0.055,
               chords: [[60, 'M'], [53, 'M'], [55, 'M'], [60, 'M']],
               kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
               bass: 'r...5...o...5...', mel: 'o...o.f...t.o...' }
  };
  var GAME_ROTATION = ['rush', 'y2k', 'counter', 'funk'];

  function ensure() {
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = BASEVOL;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') { try { ctx.resume(); } catch (e) {} }
    return true;
  }
  function env(o, g, t, vol, dur, dest) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.03);
  }
  function tone(f, t, dur, type, vol) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); env(o, g, t, vol, dur); }
  function noise(t, dur, vol, ftype, freq) {
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur)), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = ctx.createBufferSource(); s.buffer = b;
    var f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
    var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(t, v) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
    g.gain.setValueAtTime(v || 0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.18);
  }
  function snare(t, v) { noise(t, 0.12, v || 0.2, 'bandpass', 1900); tone(185, t, 0.07, 'triangle', 0.05); }
  function hat(t, open, v) { noise(t, open ? 0.11 : 0.035, v || (open ? 0.11 : 0.06), 'highpass', 7400); }
  function heartbeat(t) { tone(56, t, 0.14, 'sine', 0.5); tone(52, t + 0.16, 0.12, 'sine', 0.38); }
  function tick(t) { tone(2300, t, 0.022, 'square', 0.05 + pressure * 0.008); }

  function secPer16() { var s = SONGS[songKey]; return 60 / (s.bpm * (1 + 0.065 * pressure)) / 4; }
  function playStep(i, t) {
    var s = SONGS[songKey], bar = Math.floor(i / 16) % 4, st = i % 16, ch = s.chords[bar], rt = ch[0], q = ch[1];
    var p = pressure, dur = secPer16();
    if (s.kick[st] === 'x' || (p >= 3 && st % 4 === 0)) kick(t);
    if (s.snare[st] === 'x' || (p >= 4 && st >= 12)) snare(t, p >= 4 && st >= 12 ? 0.12 + (st - 12) * 0.03 : 0.2);
    if (s.hat[st] !== '.' || p >= 2) hat(t, s.hat[st] === 'o', p >= 2 ? 0.07 + p * 0.01 : null);
    var b = s.bass[st]; if (b !== '.') { var bf = hz(rt - 12 + deg(b, q)); tone(bf, t, dur * 1.7, 'square', 0.045); tone(bf / 2, t, dur * 1.9, 'sine', 0.09); }
    if (st === 0) [0, deg('3', q), 7].forEach(function (d) { tone(hz(rt + d), t, dur * 14, 'triangle', 0.032); });
    var m = s.mel[st]; if (m !== '.') tone(hz(rt + 12 + deg(m, q)), t, dur * 1.6, s.lead, s.lv);
    if (p >= 1 && (st % 2 === 0 || p >= 3)) tick(t);
    if (p >= 4 && st % 4 === 0) heartbeat(t);
  }
  function scheduler() {
    if (!ctx || !on) return;
    if (nextTime < ctx.currentTime - 0.05) nextTime = ctx.currentTime + 0.03; // tab was asleep: skip, don't pile up
    while (nextTime < ctx.currentTime + 0.12) { playStep(step, nextTime); nextTime += secPer16(); step++; }
  }
  function updateRiser() {
    if (!ctx) return;
    if (pressure > 0 && on) {
      if (!riser) {
        riser = ctx.createOscillator(); riser.type = 'sawtooth';
        riserFilt = ctx.createBiquadFilter(); riserFilt.type = 'lowpass';
        riserGain = ctx.createGain(); riserGain.gain.value = 0;
        riser.connect(riserFilt); riserFilt.connect(riserGain); riserGain.connect(master); riser.start();
      }
      var t = ctx.currentTime;
      riser.frequency.linearRampToValueAtTime(110 * Math.pow(2, pressure / 2.2), t + 0.9);
      riserFilt.frequency.linearRampToValueAtTime(380 * Math.pow(2, pressure / 1.4), t + 0.9);
      riserGain.gain.linearRampToValueAtTime(0.012 * pressure, t + 0.3);
    } else if (riser) {
      try { var t2 = ctx.currentTime; riserGain.gain.linearRampToValueAtTime(0, t2 + 0.15); riser.stop(t2 + 0.2); } catch (e) {}
      riser = null;
    }
  }
  function setVol() { if (master && on) master.gain.linearRampToValueAtTime(BASEVOL * duckTo * (1 + 0.07 * pressure), ctx.currentTime + 0.2); }

  var BEEPS = [0, 660, 740, 831, 988, 1175];
  function setPressure(l) {
    l = Math.max(0, Math.min(5, l | 0));
    if (l === pressure) return;
    var up = l > pressure; pressure = l; LOG.push({ t: Date.now(), ev: 'pressure', v: l });
    if (up && l > 0 && on) { var t = ctx.currentTime; tone(BEEPS[l], t, 0.16, 'square', 0.07 + l * 0.012); tone(BEEPS[l] * 1.5, t + 0.02, 0.12, 'triangle', 0.04); }
    updateRiser(); setVol();
  }
  function setSong(k) {
    if (!SONGS[k] || k === songKey) return;
    songKey = k; step = 0; if (GAME_ROTATION.indexOf(k) > -1) lastGame = k;
    LOG.push({ t: Date.now(), ev: 'song', v: k });
  }
  /* iPhone fix: browser synth audio is muted by the ring/silent switch. Declaring "playback" (iOS 16.4+)
     and running a silent looping media element (older iOS) moves the page into the media channel,
     which ignores the silent switch - like a video would. Must be called from a tap. */
  var SILENT = 'data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  var mediaEl = null;
  function unlockIOS() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      if (!mediaEl) { mediaEl = document.createElement('audio'); mediaEl.src = SILENT; mediaEl.loop = true;
        mediaEl.setAttribute('playsinline', ''); mediaEl.setAttribute('x-webkit-airplay', 'deny'); mediaEl.preload = 'auto'; mediaEl.volume = 0.01; }
      var p = mediaEl.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function start() {
    try {
      unlockIOS();
      if (!ensure()) return false;
      if (on) return true;
      on = true; nextTime = ctx.currentTime + 0.05; step = 0; master.gain.value = BASEVOL;
      clearInterval(sched); sched = setInterval(scheduler, 25); scheduler(); updateRiser();
      LOG.push({ t: Date.now(), ev: 'start', v: songKey });
      return true;
    } catch (e) { return false; }
  }
  function stop() { try { if (mediaEl) mediaEl.pause(); } catch (e) {} on = false; clearInterval(sched); sched = null; if (master) master.gain.value = 0; updateRiser(); }
  function sting(kind) {
    try {
      if (!ensure()) return;
      var t0 = ctx.currentTime;
      if (kind === 'bell') {   // pharmacy counter "ding"
        [1568, 3136, 4700].forEach(function (f, k) {
          var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime([0.22, 0.08, 0.04][k], t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.4);
          o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 1.45);
        });
        return;
      }
      var seq = kind === 'win' ? [523, 659, 784, 1047] : [660, 520];
      seq.forEach(function (f, i) {
        var t = t0 + i * 0.11, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.31);
      });
    } catch (e) {}
  }
  root.STATMusic = {
    start: start, stop: stop, toggle: function () { on ? stop() : start(); return on; },
    isOn: function () { return on; },
    duck: function (v) { duckTo = v / BASEVOL; setVol(); },
    setSong: setSong, song: function () { return songKey; }, songName: function () { return SONGS[songKey].name; },
    songForRound: function (roundId) { return GAME_ROTATION[(Math.max(1, roundId | 0) - 1) % GAME_ROTATION.length]; },
    setMode: function (m) { setSong(m === 'sudden' ? 'sudden' : lastGame); },   // backward compatible
    setPressure: setPressure, pressure: function () { return pressure; },
    sting: sting, arm: function () { try { ensure(); } catch (e) {} }, unlock: unlockIOS,
    state: function () { return ctx ? ctx.state : 'none'; },
    SONGS: SONGS
  };
})(window);
