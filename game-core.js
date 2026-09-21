/* ============================================================
   STAT! Live — shared game core
   Pure logic + content + HTML builders. No Firebase, no DOM events.
   Loaded by index.html (players), admin.html (host), and the tests.
   ============================================================ */
(function (root) {
  'use strict';

  // ---- Content. Every question is 4-option multiple choice so scoring is automatic. ----
  var ROUNDS = [
    { id: 1, name: 'Y2K Throwback', pts: 1, blurb: 'Early 2000s. If you owned a flip phone, this is your round.',
      q: [
        { type: 'mc', prompt: 'Which boy band released "Bye Bye Bye" in 2000?',
          options: ['Backstreet Boys','*NSYNC','98 Degrees','O-Town'], answer: 1,
          fact: 'Their album No Strings Attached sold 2.4 million copies in its first week — a record that stood for 15 years.' },
        { type: 'mc', prompt: 'Which 2003 movie stars a forgetful blue fish named Dory?',
          options: ['Shark Tale','Finding Nemo','The Little Mermaid','Happy Feet'], answer: 1,
          fact: 'Dory could famously "speak whale." The film won the Oscar for Best Animated Feature.' },
        { type: 'mc', prompt: 'In Mean Girls (2004), what day do the Plastics wear pink?',
          options: ['Mondays','Wednesdays','Fridays','Every day'], answer: 1,
          fact: '"On Wednesdays we wear pink." October 3rd is now unofficially Mean Girls Day.' }
      ] },
    { id: 2, name: 'Count It', pts: 2, blurb: 'Count the tray. Techs, this is your moment to shine.',
      q: [
        { type: 'count', seed: 11, kind: 'tab', count: 27, prompt: 'How many tablets are on this tray?',
          options: ['24','27','30','33'], answer: 1,
          fact: 'Counting by fives beats counting by ones — and it is the only way to survive a 1,000-count bottle.' },
        { type: 'count', seed: 23, kind: 'cap', count: 41, prompt: 'How many capsules are on this tray?',
          options: ['39','41','43','45'], answer: 1,
          fact: 'Double-count anything controlled. CII counts need a second set of initials.' }
      ] },
    { id: 3, name: 'Name That Tune', pts: 1, blurb: 'Early 2000s radio. You know these.',
      q: [
        { type: 'mc', prompt: 'Who sang the 2002 hit "Complicated"?',
          options: ['Michelle Branch','Avril Lavigne','Vanessa Carlton','Pink'], answer: 1,
          fact: 'She was 17 when it came out. The skater-punk-with-a-necktie look defined an entire era of mall fashion.' },
        { type: 'mc', prompt: 'Which artist released the 2000s anthem "Since U Been Gone"?',
          options: ['Kelly Clarkson','Britney Spears','Christina Aguilera','Hilary Duff'], answer: 0,
          fact: 'She won the very first season of American Idol in 2002, back when the show was still called a gamble.' },
        { type: 'mc', prompt: 'Which group released "Hey Ya!" in 2003?',
          options: ['OutKast','Black Eyed Peas','Gnarls Barkley','The Roots'], answer: 0,
          fact: 'Shake it like a Polaroid picture. Polaroid actually put out a statement asking people to please not do that.' },
      ] },
    { id: 4, name: 'Spot the Error', pts: 2, blurb: 'One thing is wrong on each label. Tap what it is.',
      q: [
        { type: 'spot', layout: 'pair',
          cards: [
            { title: 'ORDER', lines: ['Pt: DOE, JANE  MRN 4471982','DRUG: Metformin 500 mg tablet','Sig: 1 tab PO twice daily w/ meals','Qty: 60   Refills: 3'] },
            { title: 'DISPENSED', lines: ['Pt: DOE, JANE  MRN 4471982','DRUG: Metoprolol tartrate 50 mg tab','Sig: 1 tab PO twice daily w/ meals','Qty: 60   Refills: 3'] } ],
          prompt: 'What is wrong here?',
          options: ['Wrong quantity','Wrong drug — metoprolol for metformin','Wrong directions','Wrong patient'], answer: 1,
          fact: 'Metformin / metoprolol is a classic look-alike. The Sig and quantity matched perfectly, which is exactly why it slips through.' },
      ] },
    { id: 5, name: 'Small Screen', pts: 1, blurb: 'TV you definitely watched.',
      q: [
        { type: 'mc', prompt: 'In The Office (US), what is the name of the paper company?',
          options: ['Dunder Mifflin','Vance Refrigeration','Sabre','Staples'], answer: 0,
          fact: 'The Scranton branch. "That\'s what she said" was largely improvised by Steve Carell.' },
        { type: 'mc', prompt: 'On Friends, what was the name of the coffee shop?',
          options: ['Central Perk','Java Joe\'s','The Grind','Monk\'s'], answer: 0,
          fact: 'The orange couch was found in the Warner Bros. basement. It is now a museum piece.' },
        { type: 'mc', prompt: 'Which 2000s show made Ryan Seacrest a household name?',
          options: ['Survivor','American Idol','The Bachelor','Big Brother'], answer: 1,
          fact: 'At its 2006 peak, over 30 million people watched the finale — more than most Super Bowls that decade.' },
      ] },
    { id: 6, name: 'Pharmacy 101', pts: 2, blurb: 'Things every pharmacy student knows. Everyone else, guess wisely.',
      q: [
        { type: 'mc', prompt: 'What is the antidote for an acetaminophen (Tylenol) overdose?',
          options: ['Naloxone','N-acetylcysteine','Flumazenil','Protamine'], answer: 1,
          fact: 'NAC replenishes glutathione so the liver can neutralize the toxic metabolite NAPQI. Given early, it works beautifully.' },
        { type: 'mc', prompt: 'Which vitamin reverses warfarin?',
          options: ['Vitamin C','Vitamin K','Vitamin D','Vitamin B12'], answer: 1,
          fact: 'Warfarin blocks vitamin K recycling. 4-factor PCC works in minutes; vitamin K takes hours because the liver must build new clotting factors.' },
      ] },
    { id: 7, name: 'Emoji Decode', pts: 2, blurb: 'What movie is this?',
      q: [
        { type: 'mc', prompt: 'LION + CROWN + SUNRISE  ( 🦁 👑 🌅 )',
          options: ['Madagascar','The Lion King','Zootopia','Jungle Book'], answer: 1,
          fact: 'The 2019 remake made over $1.6 billion worldwide.' },
        { type: 'mc', prompt: 'WIZARD + LIGHTNING + CASTLE + OWL  ( 🧙 ⚡ 🏰 🦉 )',
          options: ['Lord of the Rings','Narnia','Harry Potter','Percy Jackson'], answer: 2,
          fact: 'Rejected by twelve publishers before Bloomsbury took a chance on it.' },
      ] },
    { id: 8, name: 'Sound-Alike Showdown', pts: 2, blurb: 'The look-alike, sound-alike round.',
      q: [
        { type: 'mc', prompt: 'Hydroxyzine is constantly confused with which blood pressure drug?',
          options: ['Hydralazine','Hydrochlorothiazide','Hydrocortisone','Hydroxychloroquine'], answer: 0,
          fact: 'One treats itching and anxiety, one drops blood pressure. Tall-man lettering exists for exactly this: hydrOXYzine vs hydrALAZINE.' },
        { type: 'mc', prompt: 'Which pair is a classic look-alike/sound-alike warning in pharmacy?',
          options: ['Celebrex and Celexa','Aspirin and Tylenol','Ibuprofen and Naproxen','Zyrtec and Claritin'], answer: 0,
          fact: 'Celebrex (arthritis), Celexa (depression) and Cerebyx (seizures) — three different drugs, three similar names. A textbook ISMP case study.' }
      ] },
    { id: 9, name: 'Where Does It Go?', pts: 1, blurb: 'Where does this live in the pharmacy?',
      q: [
        { type: 'mc', prompt: 'An unopened vial of insulin',
          options: ['Fridge','Room-temp shelf','Locked vault','Freezer'], answer: 0,
          fact: 'Unopened insulin lives at 2-8 C. Once in use, most pens are fine at room temp for 28 days. Never freeze it.' },
      ] },
    { id: 10, name: 'Final Wager', pts: 5, wager: true, blurb: 'Bet 0-5 before you see it. A World Pharmacists Day finale.',
      q: [
        { type: 'mc', prompt: 'Coca-Cola was created in 1886 by John Pemberton, who worked as a...',
          options: ['Pharmacist','Dentist','Chef','Chemistry teacher'], answer: 0,
          fact: 'He sold it as a nerve tonic at a pharmacy soda fountain. Pepsi (Caleb Bradham) and Dr Pepper (Charles Alderton) were pharmacists too — your profession basically invented soda.' }
      ] }
  ];

  // ---- Flatten to a single ordered list the admin steps through ----
  var QUESTIONS = [];
  ROUNDS.forEach(function (r) {
    r.q.forEach(function (q, i) {
      QUESTIONS.push({
        key: r.id + '-' + (i + 1),
        roundId: r.id, roundName: r.name, roundBlurb: r.blurb,
        pts: r.pts, isWager: !!r.wager,
        type: q.type, prompt: q.prompt, options: q.options.slice(),
        answer: q.answer, fact: q.fact,
        seed: q.seed, kind: q.kind, count: q.count, layout: q.layout, cards: q.cards
      });
    });
  });


  // ---- Sudden death: 5 super-easy pop culture questions, 5 seconds each ----
  var SUDDEN = [
    { prompt: 'Which superhero is known as the Caped Crusader?',
      options: ['Batman','Superman','Spider-Man','Thor'], answer: 0 },
    { prompt: 'What color is SpongeBob SquarePants?',
      options: ['Blue','Yellow','Green','Pink'], answer: 1 },
    { prompt: 'Which movie features a shark and the line "You\'re gonna need a bigger boat"?',
      options: ['Jaws','Titanic','Finding Nemo','The Meg'], answer: 0 },
    { prompt: 'Who is the famous mouse mascot of Disney?',
      options: ['Jerry','Mickey','Stuart','Speedy'], answer: 1 },
    { prompt: 'In The Wizard of Oz, "There\'s no place like ___"',
      options: ['Kansas','Home','Oz','Bed'], answer: 1 }
  ];
  SUDDEN.forEach(function (q, i) { q.key = 'sd-' + (i + 1); q.type = 'mc'; q.pts = 1; q.sudden = true;
    q.roundId = 'SD'; q.roundName = 'Sudden Death'; q.fact = ''; });

  function maxScore() {
    return QUESTIONS.reduce(function (s, q) { return s + q.pts; }, 0);
  }

  // ---- Scoring. Idempotent full recompute from all recorded answers. ----
  // answersByQ: { "<qKey>": { "<pid>": { choice:Int, ms:Int, wager:Int? } } }
  // players:    { "<pid>": { name } }  -> returns { pid: {score,totalMs,correct,answered} }
  function computeScores(players, answersByQ) {
    var out = {};
    Object.keys(players || {}).forEach(function (pid) { out[pid] = { score: 0, totalMs: 0, correct: 0, answered: 0 }; });
    QUESTIONS.forEach(function (q) {
      var a = (answersByQ || {})[q.key] || {};
      Object.keys(a).forEach(function (pid) {
        if (!out[pid]) return; // answer from a player no longer present
        var ans = a[pid];
        var right = ans && ans.choice === q.answer;
        out[pid].answered += 1;
        out[pid].totalMs += (ans && typeof ans.ms === 'number') ? ans.ms : 0;
        if (q.isWager) {
          var w = ans && typeof ans.wager === 'number' ? Math.max(0, Math.min(5, ans.wager)) : 0;
          out[pid].score += right ? w : -w;
          if (right) out[pid].correct += 1;
        } else if (right) {
          out[pid].score += q.pts;
          out[pid].correct += 1;
        }
      });
    });
    // never show a negative total at a party — floor at zero
    Object.keys(out).forEach(function (pid) { if (out[pid].score < 0) out[pid].score = 0; });
    return out;
  }

  // ---- Ranking: score desc, then faster totalMs, then name. Ties share a rank. ----
  function rankPlayers(players, scores) {
    var rows = Object.keys(players || {}).map(function (pid) {
      var s = (scores && scores[pid]) || { score: 0, totalMs: 0, correct: 0, answered: 0 };
      return { pid: pid, name: (players[pid] && players[pid].name) || '—',
        score: s.score, totalMs: s.totalMs, correct: s.correct, answered: s.answered };
    });
    rows.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.totalMs !== b.totalMs) return a.totalMs - b.totalMs;
      return a.name.localeCompare(b.name);
    });
    var rank = 0, lastScore = null, lastMs = null;
    rows.forEach(function (row, i) {
      if (row.score !== lastScore || row.totalMs !== lastMs) { rank = i + 1; lastScore = row.score; lastMs = row.totalMs; }
      row.rank = rank;
    });
    return rows;
  }


  // Rank sudden-death: correct answers first, then fastest. Returns [{pid,name,correct,ms}]
  function rankSudden(players, sdAnswers) {
    var rows = Object.keys(players || {}).map(function (pid) {
      var c = 0, ms = 0;
      SUDDEN.forEach(function (q) {
        var a = ((sdAnswers || {})[q.key] || {})[pid];
        if (a) { ms += (typeof a.ms === 'number' ? a.ms : 5000); if (a.choice === q.answer) c++; }
        else { ms += 5000; }
      });
      return { pid: pid, name: (players[pid] && players[pid].name) || '-', correct: c, totalMs: ms };
    });
    rows.sort(function (a, b) {
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (a.totalMs !== b.totalMs) return a.totalMs - b.totalMs;
      return a.name.localeCompare(b.name);
    });
    var rank = 0, lc = null, lm = null;
    rows.forEach(function (r, i) {
      if (r.correct !== lc || r.totalMs !== lm) { rank = i + 1; lc = r.correct; lm = r.totalMs; }
      r.rank = rank;
    });
    return rows;
  }

  // Who is tied for a podium place? Returns the pids tied at the top-3 boundary.
  function findTies(ranked) {
    if (!ranked || ranked.length < 2) return [];
    // Group by SCORE (not by rank — rank is already split by the speed tiebreak).
    var groups = [], seen = {};
    ranked.forEach(function (r) {
      if (seen[r.score] === undefined) { seen[r.score] = groups.length; groups.push({ score: r.score, rows: [] }); }
      groups[seen[r.score]].rows.push(r);
    });
    // A score group matters if it straddles any of places 1-3.
    var tied = [], place = 1;
    groups.forEach(function (gp) {
      var first = place, last = place + gp.rows.length - 1;
      if (gp.rows.length > 1 && first <= 3) tied = tied.concat(gp.rows);
      place = last + 1;
    });
    return tied;
  }

  // ---- Deterministic tray SVG (identical on every device) ----
  function trayHTML(seed, count, kind) {
    function rng(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
    var W = 900, H = 520, cols = 12, rows = 7, cw = W / cols, ch = H / rows, r = rng(seed * 9301 + 49297);
    var cells = []; for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) cells.push([x, y]);
    for (var i = cells.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="tray of ' + count + ' items">';
    for (var k = 0; k < count; k++) {
      var cx = cells[k][0], cy = cells[k][1];
      var px = cx * cw + cw / 2 + (r() - 0.5) * cw * 0.35, py = cy * ch + ch / 2 + (r() - 0.5) * ch * 0.35;
      var kk = kind === 'cap' ? 'cap' : (kind === 'tab' ? 'tab' : (r() < 0.5 ? 'tab' : 'cap'));
      if (kk === 'tab') out += '<g transform="translate(' + px + ',' + py + ')"><circle r="24" fill="#F7F2E6" stroke="#B8AE96" stroke-width="2.5"/><line x1="-15" y1="0" x2="15" y2="0" stroke="#B8AE96" stroke-width="2.5"/></g>';
      else out += '<g transform="translate(' + px + ',' + py + ') rotate(' + (r() * 180) + ')"><rect x="-30" y="-13" width="60" height="26" rx="13" fill="#E4573D" stroke="#9E3A28" stroke-width="2"/><path d="M0,-13 h17 a13,13 0 0 1 0,26 h-17 z" fill="#FFF4D6"/></g>';
    }
    return out + '</svg>';
  }

  function extraHTML(q) {
    if (!q) return '';
    if (q.type === 'count') return '<div class="tray">' + trayHTML(q.seed, q.count, q.kind) + '</div>';
    if (q.type === 'spot') {
      var cls = q.layout === 'pair' ? 'mock' : 'mock single';
      return '<div class="' + cls + '">' + q.cards.map(function (c) {
        return '<div class="card"><h4>' + c.title + '</h4>' + c.lines.map(function (l) { return '<div>' + l + '</div>'; }).join('') + '<div class="bar"></div></div>';
      }).join('') + '</div>';
    }
    return '';
  }

  root.STAT = {
    ROUNDS: ROUNDS, QUESTIONS: QUESTIONS, SUDDEN: SUDDEN, maxScore: maxScore,
    rankSudden: rankSudden, findTies: findTies,
    computeScores: computeScores, rankPlayers: rankPlayers,
    trayHTML: trayHTML, extraHTML: extraHTML,
    LETTERS: ['A', 'B', 'C', 'D']
  };
})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : global).STAT;
