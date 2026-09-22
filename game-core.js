/* ============================================================
   STAT! Live — shared game core
   Pure logic + content + HTML builders. No Firebase, no DOM events.
   Loaded by index.html (players), admin.html (host), and the tests.
   ============================================================ */
(function (root) {
  'use strict';

  // ---- Content. Every question is 4-option multiple choice so scoring is automatic. ----
  var ROUNDS = [
    { id: 1, name: 'Y2K Throwback', short: 'Early-2000s movies & pop hits', kind: 'pop', pts: 1, blurb: 'Early 2000s. If you owned a flip phone, this is your round.',
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
    { id: 2, name: 'Count It', short: 'Count the pills on the tray', kind: 'pharm', pts: 2, blurb: 'Count the tray. Techs, this is your moment to shine.',
      q: [
        { type: 'count', seed: 11, kind: 'tab', count: 27, prompt: 'How many tablets are on this tray?',
          options: ['24','27','30','33'], answer: 1,
          fact: 'Counting by fives beats counting by ones — and it is the only way to survive a 1,000-count bottle.' },
        { type: 'count', seed: 23, kind: 'cap', count: 41, prompt: 'How many capsules are on this tray?',
          options: ['39','41','43','45'], answer: 1,
          fact: 'Double-count anything controlled. CII counts need a second set of initials.' }
      ] },
    { id: 3, name: 'Name That Tune', short: '2000s radio — who sang it?', kind: 'pop', pts: 1, blurb: 'Early 2000s radio. You know these.',
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
    { id: 4, name: 'Spot the Error', short: 'Find the mistake on the Rx label', kind: 'pharm', pts: 2, blurb: 'One thing is wrong on each label. Tap what it is.',
      q: [
        { type: 'spot', layout: 'pair',
          cards: [
            { title: 'ORDER', lines: ['Pt: DOE, JANE  MRN 4471982','DRUG: Metformin 500 mg tablet','Sig: 1 tab PO twice daily w/ meals','Qty: 60   Refills: 3'] },
            { title: 'DISPENSED', lines: ['Pt: DOE, JANE  MRN 4471982','DRUG: Metoprolol tartrate 50 mg tab','Sig: 1 tab PO twice daily w/ meals','Qty: 60   Refills: 3'] } ],
          prompt: 'What is wrong here?',
          options: ['Wrong quantity','Wrong drug — metoprolol for metformin','Wrong directions','Wrong patient'], answer: 1,
          fact: 'Metformin / metoprolol is a classic look-alike. The Sig and quantity matched perfectly, which is exactly why it slips through.' },
      ] },
    { id: 5, name: 'Small Screen', short: 'TV shows you definitely binged', kind: 'pop', pts: 1, blurb: 'TV you definitely watched.',
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
    { id: 6, name: 'Pharmacy 101', short: 'What every pharmacy student knows', kind: 'pharm', pts: 2, blurb: 'Things every pharmacy student knows. Everyone else, guess wisely.',
      q: [
        { type: 'mc', prompt: 'What is the antidote for an acetaminophen (Tylenol) overdose?',
          options: ['Naloxone','N-acetylcysteine','Flumazenil','Protamine'], answer: 1,
          fact: 'NAC replenishes glutathione so the liver can neutralize the toxic metabolite NAPQI. Given early, it works beautifully.' },
        { type: 'mc', prompt: 'Which vitamin reverses warfarin?',
          options: ['Vitamin C','Vitamin K','Vitamin D','Vitamin B12'], answer: 1,
          fact: 'Warfarin blocks vitamin K recycling. 4-factor PCC works in minutes; vitamin K takes hours because the liver must build new clotting factors.' },
      ] },
    { id: 7, name: 'Emoji Decode', short: 'Guess the movie from emojis', kind: 'pop', pts: 2, blurb: 'What movie is this?',
      q: [
        { type: 'mc', prompt: 'LION + CROWN + SUNRISE  ( 🦁 👑 🌅 )',
          options: ['Madagascar','The Lion King','Zootopia','Jungle Book'], answer: 1,
          fact: 'The 2019 remake made over $1.6 billion worldwide.' },
        { type: 'mc', prompt: 'WIZARD + LIGHTNING + CASTLE + OWL  ( 🧙 ⚡ 🏰 🦉 )',
          options: ['Lord of the Rings','Narnia','Harry Potter','Percy Jackson'], answer: 2,
          fact: 'Rejected by twelve publishers before Bloomsbury took a chance on it.' },
      ] },
    { id: 8, name: 'Sound-Alike Showdown', short: 'Look-alike, sound-alike drug names', kind: 'pharm', pts: 2, blurb: 'The look-alike, sound-alike round.',
      q: [
        { type: 'mc', prompt: 'Hydroxyzine is constantly confused with which blood pressure drug?',
          options: ['Hydralazine','Hydrochlorothiazide','Hydrocortisone','Hydroxychloroquine'], answer: 0,
          fact: 'One treats itching and anxiety, one drops blood pressure. Tall-man lettering exists for exactly this: hydrOXYzine vs hydrALAZINE.' },
        { type: 'mc', prompt: 'Which pair is a classic look-alike/sound-alike warning in pharmacy?',
          options: ['Celebrex and Celexa','Aspirin and Tylenol','Ibuprofen and Naproxen','Zyrtec and Claritin'], answer: 0,
          fact: 'Celebrex (arthritis), Celexa (depression) and Cerebyx (seizures) — three different drugs, three similar names. A textbook ISMP case study.' }
      ] },
    { id: 9, name: 'Where Does It Go?', short: 'Fridge, shelf, or locked vault?', kind: 'pharm', pts: 1, blurb: 'Where does this live in the pharmacy?',
      q: [
        { type: 'mc', prompt: 'An unopened vial of insulin',
          options: ['Fridge','Room-temp shelf','Locked vault','Freezer'], answer: 0,
          fact: 'Unopened insulin lives at 2-8 C. Once in use, most pens are fine at room temp for 28 days. Never freeze it.' },
      ] },
    { id: 10, name: 'Final Wager', short: 'Bet 0–5 points on one last question', kind: 'wager', pts: 5, wager: true, blurb: 'Bet 0-5 before you see it. A World Pharmacists Day finale.',
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
        roundId: r.id, roundName: r.name, roundBlurb: r.blurb, roundShort: r.short || '', roundKind: r.kind || '',
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


  // ---- Die-cut pharmacy stickers (SVG, 100x100). Pure strings, no DOM. ----
  var O = 'stroke="#fff" stroke-width="9" stroke-linejoin="round" paint-order="stroke"';
  var FACE = function (x, y, k) {
    k = k || 1;
    var e = 7 * k, r = 2.6 * k, sm = 6 * k, sd = 12 * k, ch = 12 * k;
    return '<circle cx="' + (x - e) + '" cy="' + y + '" r="' + r + '" fill="#2A1206"/><circle cx="' + (x + e) + '" cy="' + y + '" r="' + r + '" fill="#2A1206"/>' +
      '<path d="M' + (x - sm) + ' ' + (y + sm) + ' Q' + x + ' ' + (y + sd) + ' ' + (x + sm) + ' ' + (y + sm) + '" fill="none" stroke="#2A1206" stroke-width="' + (2.4 * k) + '" stroke-linecap="round"/>' +
      '<circle cx="' + (x - ch) + '" cy="' + (y + 5 * k) + '" r="' + (3 * k) + '" fill="#F28C8C" opacity=".8"/><circle cx="' + (x + ch) + '" cy="' + (y + 5 * k) + '" r="' + (3 * k) + '" fill="#F28C8C" opacity=".8"/>';
  };
  var STICKERS = {
    capsule: '<svg viewBox="0 0 100 100"><g transform="rotate(-28 50 50)">' +
      '<rect x="12" y="32" width="76" height="36" rx="18" fill="#FBEFD2" ' + O + '/>' +
      '<path d="M50 32 H30 a18 18 0 0 0 0 36 H50 Z" fill="#C8371F"/>' +
      '<rect x="12" y="32" width="76" height="36" rx="18" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      FACE(64, 46) + '<path d="M22 40 q4 -4 10 -4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g></svg>',
    tablet: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="33" fill="#FFF7EA" ' + O + '/>' +
      '<circle cx="50" cy="50" r="33" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      FACE(50, 46, 1.7) + '</svg>',
    bottle: '<svg viewBox="0 0 100 100"><g ' + O + '>' +
      '<rect x="28" y="10" width="44" height="16" rx="4" fill="#fff" stroke="#2A1206" stroke-width="3"/>' +
      '<rect x="24" y="24" width="52" height="68" rx="9" fill="#E89A2C" stroke="#2A1206" stroke-width="3"/></g>' +
      '<rect x="24" y="24" width="52" height="68" rx="9" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<rect x="30" y="42" width="40" height="30" rx="3" fill="#FBEFD2" stroke="#2A1206" stroke-width="2"/>' +
      '<text x="50" y="63" text-anchor="middle" font-family="Arial" font-weight="900" font-size="17" fill="#C8371F">Rx</text>' +
      '<path d="M32 30 v52" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/></svg>',
    mortar: '<svg viewBox="0 0 100 100"><g ' + O + '>' +
      '<path d="M60 44 L82 14" stroke="#7A4A22" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M16 46 H84 C84 72 70 84 50 84 C30 84 16 72 16 46 Z" fill="#2E7D5B"/></g>' +
      '<path d="M60 44 L82 14" stroke="#7A4A22" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M16 46 H84 C84 72 70 84 50 84 C30 84 16 72 16 46 Z" fill="#2E7D5B" stroke="#2A1206" stroke-width="3"/>' +
      '<rect x="12" y="41" width="76" height="9" rx="4.5" fill="#3C9A73" stroke="#2A1206" stroke-width="3"/>' +
      '<text x="50" y="72" text-anchor="middle" font-family="Arial" font-weight="900" font-size="15" fill="#FBEFD2">Rx</text>' +
      '<path d="M86 30 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 z" fill="#F0A828"/></svg>',
    rx: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#C8371F" ' + O + '/>' +
      '<circle cx="50" cy="50" r="38" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="30" fill="none" stroke="#FBEFD2" stroke-width="2" stroke-dasharray="4 4"/>' +
      '<text x="50" y="62" text-anchor="middle" font-family="Arial" font-weight="900" font-size="34" fill="#FBEFD2">Rx</text></svg>',
    heart: '<svg viewBox="0 0 100 100"><path d="M50 84 C20 64 12 48 14 34 C16 20 30 14 40 20 C45 23 48 27 50 31 C52 27 55 23 60 20 C70 14 84 20 86 34 C88 48 80 64 50 84 Z" fill="#E4573D" ' + O + '/>' +
      '<path d="M50 84 C20 64 12 48 14 34 C16 20 30 14 40 20 C45 23 48 27 50 31 C52 27 55 23 60 20 C70 14 84 20 86 34 C88 48 80 64 50 84 Z" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<path d="M26 34 q2 -8 10 -9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>' + FACE(50, 48) + '</svg>',
    happy: '<svg viewBox="0 0 100 100"><path d="M50 4 L59 22 L79 14 L75 34 L95 40 L79 53 L91 70 L70 70 L66 91 L50 78 L34 91 L30 70 L9 70 L21 53 L5 40 L25 34 L21 14 L41 22 Z" fill="#F0A828" ' + O + '/>' +
      '<path d="M50 4 L59 22 L79 14 L75 34 L95 40 L79 53 L91 70 L70 70 L66 91 L50 78 L34 91 L30 70 L9 70 L21 53 L5 40 L25 34 L21 14 L41 22 Z" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<text x="50" y="47" text-anchor="middle" font-family="Arial" font-weight="900" font-size="15" fill="#2A1206">HAPPY</text>' +
      '<text x="50" y="64" text-anchor="middle" font-family="Arial" font-weight="900" font-size="17" fill="#C8371F">WPD!</text></svg>',
    stat: '<svg viewBox="0 0 100 100"><path d="M12 20 H88 a8 8 0 0 1 8 8 V62 a8 8 0 0 1 -8 8 H44 L26 86 L30 70 H12 a8 8 0 0 1 -8 -8 V28 a8 8 0 0 1 8 -8 Z" fill="#2E7D5B" ' + O + '/>' +
      '<path d="M12 20 H88 a8 8 0 0 1 8 8 V62 a8 8 0 0 1 -8 8 H44 L26 86 L30 70 H12 a8 8 0 0 1 -8 -8 V28 a8 8 0 0 1 8 -8 Z" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<text x="50" y="55" text-anchor="middle" font-family="Arial" font-weight="900" font-size="26" fill="#FBEFD2">STAT!</text></svg>',
    blister: '<svg viewBox="0 0 100 100"><g transform="rotate(12 50 50)"><rect x="14" y="20" width="72" height="60" rx="8" fill="#D9DEE3" ' + O + '/>' +
      '<rect x="14" y="20" width="72" height="60" rx="8" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      [[32,36,'#C8371F'],[50,36,'#F0A828'],[68,36,'#2E7D5B'],[32,62,'#FFF'],[50,62,'#E4573D'],[68,62,'#F0A828']].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="' + p[2] + '" stroke="#2A1206" stroke-width="2"/>';
      }).join('') + '</g></svg>',
    nacho: '<svg viewBox="0 0 100 100"><path d="M50 8 L92 86 H8 Z" fill="#F2B84B" ' + O + ' stroke-linejoin="round"/>' +
      '<path d="M50 8 L92 86 H8 Z" fill="none" stroke="#2A1206" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M30 48 Q34 58 38 50 Q44 64 50 50 Q56 62 62 50 Q66 58 70 48 L64 38 H36 Z" fill="#FFD23F" stroke="#2A1206" stroke-width="2"/>' +
      '<circle cx="26" cy="79" r="3" fill="#2E7D5B"/><circle cx="74" cy="79" r="3" fill="#C8371F"/><circle cx="50" cy="80" r="2.4" fill="#2E7D5B"/>' + FACE(50, 64) + '</svg>',
    bandaid: '<svg viewBox="0 0 100 100"><g transform="rotate(-35 50 50)"><rect x="8" y="34" width="84" height="32" rx="16" fill="#E8B98A" ' + O + '/>' +
      '<rect x="8" y="34" width="84" height="32" rx="16" fill="none" stroke="#2A1206" stroke-width="3"/>' +
      '<rect x="36" y="38" width="28" height="24" rx="4" fill="#F6D6B4" stroke="#2A1206" stroke-width="2"/>' +
      '<circle cx="44" cy="46" r="1.6" fill="#B07A4E"/><circle cx="56" cy="46" r="1.6" fill="#B07A4E"/><circle cx="44" cy="54" r="1.6" fill="#B07A4E"/><circle cx="56" cy="54" r="1.6" fill="#B07A4E"/></g></svg>',
    verified: '<svg viewBox="0 0 100 100"><g transform="rotate(-12 50 50)"><circle cx="50" cy="50" r="40" fill="#FBEFD2" ' + O + '/>' +
      '<circle cx="50" cy="50" r="40" fill="none" stroke="#2E7D5B" stroke-width="5"/>' +
      '<path d="M32 44 L45 56 L69 32" fill="none" stroke="#2E7D5B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="50" y="74" text-anchor="middle" font-family="Arial" font-weight="900" font-size="11.5" fill="#2E7D5B" letter-spacing=".5">VERIFIED</text></g></svg>'
  };

  // Colorful drifting doodle tile for page backgrounds (CSS url()-ready)
  var BG_TILE = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><g fill="none" stroke-width="3" stroke-linecap="round">' +
    '<g stroke="#F0A828" stroke-opacity=".30"><rect x="18" y="24" width="50" height="20" rx="10" transform="rotate(-25 43 34)"/><line x1="43" y1="24" x2="43" y2="44" transform="rotate(-25 43 34)"/></g>' +
    '<g stroke="#E4573D" stroke-opacity=".28"><circle cx="168" cy="40" r="13"/><line x1="158" y1="40" x2="178" y2="40"/></g>' +
    '<g stroke="#3C9A73" stroke-opacity=".30"><path d="M112 96 v18 M103 105 h18"/></g>' +
    '<g stroke="#FBEFD2" stroke-opacity=".16"><rect x="178" y="118" width="30" height="40" rx="5"/><rect x="182" y="110" width="22" height="8" rx="2"/></g>' +
    '<g stroke="#F0A828" stroke-opacity=".26"><rect x="120" y="178" width="50" height="20" rx="10" transform="rotate(30 145 188)"/></g>' +
    '<g stroke="#E4573D" stroke-opacity=".24"><path d="M36 150 c-10 -8 -12 -18 -4 -22 c4 -2 8 0 10 4 c2 -4 6 -6 10 -4 c8 4 6 14 -4 22 l-6 4 z"/></g>' +
    '<g stroke="#3C9A73" stroke-opacity=".26"><circle cx="70" cy="206" r="10"/></g>' +
    '<g stroke="#FBEFD2" stroke-opacity=".18"><path d="M214 206 v14 M207 213 h14"/><path d="M90 30 v10 M85 35 h10"/></g>' +
    '</g><text x="96" y="160" font-family="Arial" font-weight="900" font-size="22" fill="#C8371F" fill-opacity=".22">Rx</text></svg>');

  // One line per round for the waiting page. Built from ROUNDS so edits stay in sync.
  function roundSummary() {
    return ROUNDS.map(function (r) {
      return { id: r.id, name: r.name, short: r.short || r.blurb || '', kind: r.kind || '', count: r.q.length, pts: r.pts, wager: !!r.wager };
    });
  }


  // ---- Answer quips: shown on each player's phone after every reveal.
  //      Every player gets their own shuffled order (seeded by their id), so lines are unique to them
  //      and never repeat until the pool runs out. Edit freely - keep each line in "double quotes".
  var QUIPS = {
    right: [
    "Verified! Your brain passed final check with zero interventions.",
    "Filled correctly on the first try. Frame this moment.",
    "No drug interactions with that answer. Clean as a fresh count tray.",
    "Correct! The pharmacist nodded without even looking up. Highest honor.",
    "Right! You are now cleared for unsupervised pill counting.",
    "Nailed it. No prior authorization required.",
    "Correct — dispensed faster than a STAT order.",
    "Yes! Brand-name quality answer at a generic price.",
    "Correct. Your knowledge is in stock, unlike half the wholesaler.",
    "Verified! Label it, bag it, ship it.",
    "Right! You counted that one by fives, didn't you. We can tell.",
    "Correct! Store this brain at room temperature. It's hot right now.",
    "Correct! The fax machine would've taken three business days.",
    "Nailed it. Even the Pyxis is impressed.",
    "Correct! Shelf-stable genius, no refrigeration needed.",
    "Right! More legible than any handwritten script in history.",
    "Yes! That answer cleared DUR with no alerts.",
    "Right! Tall-man lettering could never confuse you.",
    "Correct! Insurance approved it on the first submission. A miracle.",
    "Verified. Double-counted. Still right.",
    "Correct! You're the extended-release version of good decisions.",
    "Right! That answer has officially been added to the formulary.",
    "Correct! Somebody check this person for a PharmD.",
    "Right! Faster onset than an IV push.",
    "Nailed it. No black box warning on that brain.",
    "Correct! You'd pass USP 797 in your sleep.",
    "Right! Sig: keep doing exactly that.",
    "Correct! 100% fill rate on that one.",
    "Verified! Filed under 'things you just knew.'",
    "Right! First-fill success. Zero callbacks.",
    "Correct! Compounded to perfection.",
    "Right! The mortar and pestle bow to you.",
    "Correct! Zero discrepancies on this count.",
    "Yes! FEFO: First Excellent, Forever Outstanding.",
    "Right! You just earned an imaginary raise. Don't tell HR.",
    "Correct! Excellent bioavailability on that brain today.",
    "Verified! Even the barcode scanner beeped happily.",
    "Correct! Steady-state brilliance achieved.",
    "Right! Clean catch. No recall needed.",
    "Correct! That answer is ready for pickup.",
    "Nailed it! The whole pharmacy just did a little happy dance.",
    "Right! Your answer skipped the queue. VIP service.",
    "Correct! Somewhere a label printer printed a tiny trophy.",
    "Yes! That was pharmacist-level. Techs, you knew it first.",
    "Correct! Accuracy so good it should be a quality metric."
  ],
    wrong: [
    "Rejected at verification. The pharmacist has concerns.",
    "Wrong — but confidently wrong, which is honestly its own skill.",
    "Missed it. Please consult your pharmacist. Oh wait.",
    "Nope. That answer has been sent back for clarification.",
    "Incorrect. Prior authorization for that answer: denied.",
    "Wrong! Somewhere a label printer just jammed in solidarity.",
    "Not quite. Take two deep breaths and call me next question.",
    "Wrong. That answer is on backorder until further notice.",
    "Oops! Wrong bin, wrong shelf, right attitude.",
    "Nope — that was a look-alike, sound-alike trap. It got you.",
    "Wrong! Your brain is on a short break. Refills available.",
    "Missed! Let's call that a partial fill.",
    "Incorrect. Please return to the drop-off window.",
    "Wrong. Even the Pyxis is giving you a look.",
    "Nope! That answer expired last month.",
    "Rejected! Insurance says try the generic answer.",
    "Wrong! Don't worry, that one's non-formulary anyway.",
    "Not quite. That's what we call a counseling opportunity.",
    "Incorrect. Shake well before the next question.",
    "Wrong! Placed in quarantine next to the damaged stock.",
    "Nope. The only interaction was between you and the right answer.",
    "Missed! That answer needs a second verification. And a third.",
    "Wrong, but you tapped with STAT-order speed. Respect.",
    "Incorrect. The barcode scanner beeped sadly.",
    "Nope! Dose adjustment required: more trivia, less guessing.",
    "Wrong! Somebody check the lot number on that answer.",
    "Not this time. Your answer is sitting in the will-call bin.",
    "Incorrect! Let's blame the handwriting.",
    "Wrong! Refills remaining in this game: plenty. Keep going.",
    "Missed it. Sig: shake it off, try again.",
    "Nope. That answer got returned to stock.",
    "Wrong! Keep refrigerated and try again.",
    "Incorrect — the count was only off by one... answer.",
    "Wrong! You have been placed on hold with the insurance company.",
    "Nope! That one needs a pharmacist override.",
    "Missed! Label says: do not guess on an empty stomach.",
    "Wrong. Documented as a near-miss. No harm done.",
    "Incorrect! Partially filled — with enthusiasm.",
    "Nope — that's what we call an off-label answer.",
    "Wrong! Nobody saw that. Except everyone. It's fine.",
    "Missed! Tall-man lettering was invented for moments like this.",
    "Incorrect. The wholesaler shipped the wrong answer again.",
    "Wrong! Even the fax machine is sighing.",
    "Nope. Put that answer on the 'to be verified' shelf forever.",
    "Incorrect! Still a better guess than a doctor's handwriting."
  ],
    none: [
    "Missed dose! Take it as soon as you remember... next question.",
    "No answer? That script is still sitting in the drop-off bin.",
    "Time's up! This order was left in will-call.",
    "Nothing submitted. The count tray is still empty.",
    "Too slow! Even the fax machine beat you.",
    "No answer — did you get put on hold with insurance?",
    "Silence. The pharmacist is concerned.",
    "Skipped! That's a missed-dose counseling point.",
    "Blank! We'll call that a pending prior auth.",
    "The timer won this round. Rematch next question.",
    "No answer. Your brain is still processing the claim.",
    "Out of time! That answer is backordered.",
    "Empty vial. Try again next question.",
    "No tap detected. Check your fingers' expiration date.",
    "Order abandoned at pickup. Come back next question.",
    "The clock dispensed first. Tap faster next time!",
    "Nothing? Even the nachos answered faster.",
    "Still on hold... still on hold... answer next time!",
    "Zero taps. The tray, like your answer, remains uncounted.",
    "No answer submitted. Please see the pharmacist. Or the host.",
    "Time's up — this one timed out like an old prior auth.",
    "Missed it. Set a reminder for the next question!",
    "The countdown hit zero before you did.",
    "No tap? That's a 'patient declined counseling' moment.",
    "Nothing entered. The label printer waited patiently."
  ]
  };
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // n-th quip of a kind for a player: a per-player shuffle, cycling without repeats
  function quipFor(pid, kind, n) {
    var pool = QUIPS[kind] || QUIPS.right, len = pool.length, order = [], i;
    for (i = 0; i < len; i++) order.push(i);
    var s = hashStr(String(pid) + ':' + kind) || 1;
    for (i = len - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; var j = s % (i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
    var cycle = Math.floor(n / len), idx = order[((n % len) + cycle * 7) % len];
    return pool[idx];
  }

  // FINAL ranking, shared by host and phones so everyone sees identical positions.
  // Score first; among players tied for a podium spot, sudden-death results decide; then total answer time.
  function finalRanking(players, scores, sdAnswers) {
    var ranked = rankPlayers(players, scores);
    if (sdAnswers && Object.keys(sdAnswers).length) {
      var order = {}; rankSudden(players, sdAnswers).forEach(function (r, i) { order[r.pid] = i; });
      var tied = {}; findTies(ranked).forEach(function (t) { tied[t.pid] = 1; });
      ranked.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        if (tied[a.pid] && tied[b.pid]) return (order[a.pid] === undefined ? 99 : order[a.pid]) - (order[b.pid] === undefined ? 99 : order[b.pid]);
        if (a.totalMs !== b.totalMs) return a.totalMs - b.totalMs;
        return a.name.localeCompare(b.name);
      });
      ranked.forEach(function (r, i) { r.rank = i + 1; });
    }
    return ranked;
  }

  // Deal quips like cards for the WHOLE room (every phone computes the same result from the same data):
  //  - a player never sees the same line twice in a game
  //  - two players never see the same line on the same question (while the pool has lines left)
  // list: questions in order. ansOf(q,pid) -> answer or undefined. who(q) -> pids taking part in q.
  // cache: lines this phone ALREADY showed {key: line} - kept as-is so nothing changes on screen after it appears.
  function dealQuips(list, ansOf, who, seed, selfPid, cache) {
    function outc(q, a) { return !a ? 'none' : (a.choice === q.answer ? 'right' : 'wrong'); }
    var decks = {}, used = {}, out = {};
    Object.keys(QUIPS).forEach(function (k) {
      var L = QUIPS[k].length, o = [], s = hashStr(seed + '|' + k) || 1, i;
      for (i = 0; i < L; i++) o.push(i);
      for (i = L - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; var j = s % (i + 1), t = o[i]; o[i] = o[j]; o[j] = t; }
      decks[k] = o;
    });
    list.forEach(function (q, qi) {
      var onQ = { right: {}, wrong: {}, none: {} }, pids = who(q).slice().sort();
      out[q.key] = {};
      // self first, if already on screen, so the rest of the room avoids that line
      if (cache && cache[q.key] && pids.indexOf(selfPid) > -1) { pids.splice(pids.indexOf(selfPid), 1); pids.unshift(selfPid); }
      pids.forEach(function (p, idx) {
        var kind = outc(q, ansOf(q, p)), pool = QUIPS[kind], L = pool.length, deck = decks[kind], line = null;
        used[p] = used[p] || {};
        if (p === selfPid && cache && cache[q.key]) line = cache[q.key];
        else {
          var start = (idx * 7 + qi * 3) % L, j, cand, fallback = null;
          for (j = 0; j < L; j++) {
            cand = pool[deck[(start + j) % L]];
            if (used[p][cand]) continue;
            if (!onQ[kind][cand]) { line = cand; break; }
            if (fallback === null) fallback = cand;
          }
          if (!line) line = fallback || pool[deck[start]];
        }
        used[p][line] = 1; onQ[kind][line] = 1; out[q.key][p] = { line: line, kind: kind };
      });
    });
    return out;
  }

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
    rankSudden: rankSudden, findTies: findTies, finalRanking: finalRanking, QUIPS: QUIPS, quipFor: quipFor, dealQuips: dealQuips, roundSummary: roundSummary, STICKERS: STICKERS, BG_TILE: BG_TILE,
    computeScores: computeScores, rankPlayers: rankPlayers,
    trayHTML: trayHTML, extraHTML: extraHTML,
    LETTERS: ['A', 'B', 'C', 'D']
  };
})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : global).STAT;
