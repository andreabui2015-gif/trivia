/* ============================================================
   STAT! Live — shared game core
   Pure logic + content + HTML builders. No Firebase, no DOM events.
   Loaded by index.html (players), admin.html (host), and the tests.
   ============================================================ */
(function (root) {
  'use strict';

  // ---- Content. Every question is 4-option multiple choice so scoring is automatic. ----
  var ROUNDS = [
    { id: 1, name: 'Count It', pts: 2, blurb: 'Count the tray. Exact answer only — the techs live here.',
      q: [
        { type: 'count', seed: 11, kind: 'tab', count: 27, prompt: 'How many tablets are on this tray?',
          options: ['24','27','30','33'], answer: 1,
          fact: 'Counting by fives beats counting by ones — and it is the only way to survive a 1,000-count bottle.' },
        { type: 'count', seed: 23, kind: 'cap', count: 41, prompt: 'How many capsules are on this tray?',
          options: ['39','41','43','45'], answer: 1,
          fact: 'Double-count anything controlled. CII counts need a second set of initials.' }
      ] },
    { id: 2, name: 'Spot the Error', pts: 2, blurb: 'One thing is wrong on each label. Tap what it is.',
      q: [
        { type: 'spot', layout: 'pair',
          cards: [
            { title: 'ORDER', lines: ['Pt: DOE, JANE  MRN 4471982', 'DRUG: Metformin 500 mg tablet', 'Sig: 1 tab PO twice daily w/ meals', 'Qty: 60   Refills: 3'] },
            { title: 'DISPENSED', lines: ['Pt: DOE, JANE  MRN 4471982', 'DRUG: Metoprolol tartrate 50 mg tab', 'Sig: 1 tab PO twice daily w/ meals', 'Qty: 60   Refills: 3'] } ],
          prompt: 'What is wrong here?',
          options: ['Wrong quantity', 'Wrong drug — metoprolol for metformin', 'Wrong directions', 'Wrong patient'], answer: 1,
          fact: 'Metformin / metoprolol is a classic look-alike. The Sig and quantity matched perfectly, which is exactly why it slips through.' },
        { type: 'spot', layout: 'single',
          cards: [{ title: 'IV ADMIXTURE LABEL', lines: ['Pt: RIVERA, MARCUS   Rm 6-114', 'DRUG: Potassium chloride 40 mEq/100 mL', 'ROUTE: IV PUSH over 2 minutes', 'Prepared 09/01  Tech: KL  RPh: __'] }],
          prompt: 'What is wrong here?',
          options: ['Wrong concentration', 'Expired', 'KCl is never IV push — must be diluted & infused', 'Wrong route: should be IM'], answer: 2,
          fact: 'Concentrated potassium chloride IV push can stop the heart. Most hospitals removed KCl vials from patient-care areas entirely.' },
        { type: 'spot', layout: 'single',
          cards: [{ title: 'PATIENT PROFILE + LABEL', lines: ['Pt: OKAFOR, CHIDI   DOB 04/12/1961', 'ALLERGIES: PENICILLIN (anaphylaxis)', 'DRUG: Amoxicillin-clavulanate 875/125', 'Sig: 1 tab PO twice daily x 10 days'] }],
          prompt: 'What is wrong here?',
          options: ['Allergy conflict — Augmentin is a penicillin', 'Wrong dose', 'Wrong duration', 'Wrong route'], answer: 0,
          fact: 'Brand names hide drug classes. Augmentin, Unasyn, Zosyn — all penicillins. Read the allergy line first, not last.' }
      ] },
    { id: 3, name: 'Vital Signs', pts: 1, blurb: 'Quick clinical warm-ups.',
      q: [
        { type: 'mc', prompt: 'What is the antidote for an acetaminophen overdose?',
          options: ['Naloxone', 'N-acetylcysteine', 'Flumazenil', 'Protamine'], answer: 1,
          fact: 'N-acetylcysteine replenishes glutathione so the liver can neutralize the toxic metabolite NAPQI.' },
        { type: 'mc', prompt: 'Which of these is on the ISMP high-alert medication list?',
          options: ['Insulin', 'Famotidine', 'Docusate', 'Ondansetron'], answer: 0,
          fact: 'High-alert drugs are not more error-prone — but when an error happens the harm is far worse. Insulin, opioids, anticoagulants and concentrated electrolytes headline the list.' },
        { type: 'mc', prompt: 'Which vitamin reverses warfarin?',
          options: ['Vitamin C', 'Vitamin K', 'Vitamin D', 'Vitamin B12'], answer: 1,
          fact: 'For emergencies, 4-factor PCC works in minutes; vitamin K takes hours because the liver must make new clotting factors.' },
        { type: 'mc', prompt: 'A patient chart says NPO. What does that mean?',
          options: ['Nothing by mouth', 'New patient order', 'No prior overdose', 'Not for pharmacy orders'], answer: 0,
          fact: 'From the Latin nil per os. Yes, that includes the contraband vending-machine snacks.' }
      ] },
    { id: 4, name: 'Where Does It Go?', pts: 1, blurb: 'Where does this drug live in the pharmacy?',
      q: [
        { type: 'mc', prompt: 'Unopened vial of insulin glargine',
          options: ['Fridge', 'Room-temp shelf', 'Locked vault / ADC', 'Fridge AND locked'], answer: 0,
          fact: 'Unopened insulin lives at 2–8 °C. Once in use, most pens last 28 days at room temp — check the product.' },
        { type: 'mc', prompt: 'Lorazepam 2 mg/mL injection',
          options: ['Fridge', 'Room-temp shelf', 'Locked vault / ADC', 'Fridge AND locked'], answer: 3,
          fact: 'The trick one. Lorazepam injection is refrigerated AND a Schedule IV controlled substance — the locked fridge everyone forgets.' }
      ] },
    { id: 5, name: 'Sort It', pts: 2, blurb: 'Pick the correctly ordered sequence.',
      q: [
        { type: 'mc', prompt: 'FEFO: which order do you dispense these?',
          options: ['10/2026 → 12/2026 → 01/2027 → 11/2027', '11/2027 → 01/2027 → 12/2026 → 10/2026', '01/2027 → 10/2026 → 11/2027 → 12/2026', '10/2026 → 11/2027 → 12/2026 → 01/2027'], answer: 0,
          fact: 'First-expired, first-out. Shortest-dated stock goes to the front of the shelf every restock.' }
      ] },
    { id: 6, name: 'By the Numbers', pts: 2, blurb: 'Doses and standards. Know your limits.',
      q: [
        { type: 'mc', prompt: 'FDA OTC labeling: max daily acetaminophen for a healthy adult?',
          options: ['2,000 mg', '3,000 mg', '4,000 mg', '6,000 mg'], answer: 2,
          fact: 'The Tylenol brand voluntarily lowered its own label to 3,000 mg/day in 2011 — but the FDA monograph still says 4,000.' },
        { type: 'mc', prompt: 'USP <797>: max beyond-use date for a Category 1 sterile prep at room temp?',
          options: ['6 hours', '12 hours', '24 hours', '48 hours'], answer: 1,
          fact: '12 hours at controlled room temp, 24 hours refrigerated. Category 2 and 3 CSPs get longer BUDs but demand a cleanroom suite.' }
      ] },
    { id: 7, name: 'Brand or Bust', pts: 1, blurb: 'Match the brand to its generic, or the other way.',
      q: [
        { type: 'mc', prompt: 'Atorvastatin — what is the brand?',
          options: ['Crestor', 'Lipitor', 'Zocor', 'Pravachol'], answer: 1,
          fact: 'Once the best-selling drug in the world — over $125 billion in lifetime sales.' },
        { type: 'mc', prompt: 'Norco — what is the generic?',
          options: ['Oxycodone-acetaminophen', 'Hydrocodone-acetaminophen', 'Hydromorphone', 'Codeine'], answer: 1,
          fact: 'One of the most-filled controlled substances in the country.' },
        { type: 'mc', prompt: 'Zosyn — what is the generic?',
          options: ['Piperacillin-tazobactam', 'Ampicillin-sulbactam', 'Ceftriaxone', 'Meropenem'], answer: 0,
          fact: 'Tazobactam does no antibacterial work itself — it just protects piperacillin from beta-lactamases.' }
      ] },
    { id: 8, name: 'Sound-Alike Showdown', pts: 2, blurb: 'The look-alike, sound-alike round.',
      q: [
        { type: 'mc', prompt: 'Hydroxyzine is constantly confused with which antihypertensive?',
          options: ['Hydralazine', 'Hydrochlorothiazide', 'Hydrocortisone', 'Hydroxychloroquine'], answer: 0,
          fact: 'One treats itching, one drops blood pressure. Tall-man: hydrOXYzine vs hydrALAZINE.' },
        { type: 'mc', prompt: 'Celebrex (celecoxib) is dangerously confused with which anti-seizure drug?',
          options: ['Cerebyx (fosphenytoin)', 'Keppra', 'Depakote', 'Dilantin'], answer: 0,
          fact: 'The Celebrex / Cerebyx / Celexa trio is the classic ISMP case study in why brand names get reviewed before approval.' }
      ] },
    { id: 9, name: 'The Wager', pts: 5, wager: true, blurb: 'Bet 0–5 first, then answer. Right, you gain it. Wrong, you lose it.',
      q: [
        { type: 'mc', prompt: 'Coca-Cola was created in 1886 by which Atlanta pharmacist?',
          options: ['John Pemberton', 'Caleb Bradham', 'Charles Alderton', 'Joseph Priestley'], answer: 0,
          fact: 'Pemberton first sold it as a nerve tonic at a pharmacy soda fountain. Caleb Bradham (Pepsi) and Charles Alderton (Dr Pepper) were pharmacists too.' }
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
    ROUNDS: ROUNDS, QUESTIONS: QUESTIONS, maxScore: maxScore,
    computeScores: computeScores, rankPlayers: rankPlayers,
    trayHTML: trayHTML, extraHTML: extraHTML,
    LETTERS: ['A', 'B', 'C', 'D']
  };
})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : global).STAT;
