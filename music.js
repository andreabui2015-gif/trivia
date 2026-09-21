/* ============================================================
   STAT! music — original, synthesized live in the browser.
   Fast, upbeat, urgent. No audio files, no licensing.
   Used by BOTH the host page and the player phones.

   Browsers block audio until the user taps something, so this
   is always armed by a real tap (Join button / Music button).
   ============================================================ */
(function (root) {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, timer = null, step = 0, on = false, mode = 'normal';

  // Fast, driving tempo for urgency
  var BPM = 138, SPB = 60 / BPM / 2;              // eighth notes
  var BPM_SD = 168;                                // sudden death: faster still

  // Bright minor-lean progression that feels like a countdown: Am F C G
  var CHORDS = [[220, 262, 330], [175, 220, 262], [262, 330, 392], [196, 247, 294]];
  var LEAD   = [440, 523, 659, 523, 587, 659, 784, 659];
  var LEAD_SD= [659, 784, 880, 784, 659, 784, 880, 988];

  function ensure() {
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.16; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function note(f, t, dur, type, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function kick(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.10);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.17);
  }
  function hat(t, open) {
    var n = 900, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = b;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
    var g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.13 : 0.075, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.10 : 0.035));
    src.connect(hp); hp.connect(g); g.connect(master); src.start(t); src.stop(t + 0.12);
  }
  function tick() {
    if (!ctx) return;
    var t = ctx.currentTime + 0.04;
    var sd = (mode === 'sudden');
    var bar = Math.floor(step / 8) % 4, ch = CHORDS[bar], b = step % 8;
    var lead = sd ? LEAD_SD : LEAD;
    // four-on-the-floor in sudden death, backbeat otherwise
    if (sd) { if (b % 2 === 0) kick(t); } else { if (b === 0 || b === 3 || b === 4) kick(t); }
    hat(t, b === 6);
    if (b === 0) ch.forEach(function (f) { note(f / 2, t, SPB * 3.2, 'triangle', 0.05); });
    if (b % 2 === 0) note(ch[0] / 2, t, SPB * 0.8, 'square', 0.055);
    note(lead[b], t, SPB * 0.7, 'sawtooth', sd ? 0.04 : 0.03);
    step++;
  }
  function restartTimer() {
    clearInterval(timer);
    var spb = 60 / (mode === 'sudden' ? BPM_SD : BPM) / 2;
    SPB = spb;
    timer = setInterval(tick, spb * 1000);
  }
  function start() {
    try {
      ensure(); if (on) return true;
      on = true; step = 0; master.gain.value = 0.16; restartTimer(); tick(); return true;
    } catch (e) { return false; }
  }
  function stop() { on = false; clearInterval(timer); timer = null; if (master) master.gain.value = 0; }
  function setMode(m) { if (m === mode) return; mode = m; if (on) restartTimer(); }
  function duck(v) { try { if (master && on) master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.2); } catch (e) {} }
  function sting(kind) {
    try {
      ensure();
      if (kind === 'bell') {                       // pharmacy counter "ding"
        var t0 = ctx.currentTime;
        [1568, 3136, 4700].forEach(function (f, k) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime([0.22, 0.08, 0.04][k], t0);
          g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.4);
          o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 1.45);
        });
        return;
      }
      var seq = kind === 'win' ? [523, 659, 784, 1047] : kind === 'urgent' ? [880, 880] : [660, 520];
      seq.forEach(function (f, i) {
        setTimeout(function () {
          var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = f;
          g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.31);
        }, i * 110);
      });
    } catch (e) {}
  }
  root.STATMusic = {
    start: start, stop: stop, toggle: function () { on ? stop() : start(); return on; },
    isOn: function () { return on; }, duck: duck, setMode: setMode, sting: sting,
    arm: function () { try { ensure(); } catch (e) {} }
  };
})(window);
