/* Moteur : port JavaScript de app/engine.py, app/pronun.py et app/writing.py (v1.0.1) */
"use strict";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Expert"];
const EXAM_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PLACEMENT_LEVELS = EXAM_LEVELS;

const UK_US = {
  colour: "color", colours: "colors", coloured: "colored", colourful: "colorful", favour: "favor",
  favourite: "favorite", favourites: "favorites", flavour: "flavor", flavours: "flavors", honour: "honor",
  humour: "humor", labour: "labor", neighbour: "neighbor", neighbours: "neighbors", neighbourhood: "neighborhood",
  behaviour: "behavior", harbour: "harbor", rumour: "rumor", vapour: "vapor", vigour: "vigor", endeavour: "endeavor",
  centre: "center", centres: "centers", theatre: "theater", theatres: "theaters", metre: "meter", metres: "meters",
  litre: "liter", litres: "liters", kilometre: "kilometer", kilometres: "kilometers", fibre: "fiber", calibre: "caliber",
  organise: "organize", organised: "organized", organisation: "organization", realise: "realize", realised: "realized",
  recognise: "recognize", recognised: "recognized", apologise: "apologize", apologised: "apologized",
  criticise: "criticize", criticised: "criticized", emphasise: "emphasize", summarise: "summarize",
  analyse: "analyze", analysed: "analyzed", paralyse: "paralyze", catalogue: "catalog", dialogue: "dialog",
  travelled: "traveled", travelling: "traveling", traveller: "traveler", cancelled: "canceled", cancelling: "canceling",
  labelled: "labeled", modelling: "modeling", jewellery: "jewelry", programme: "program", programmes: "programs",
  defence: "defense", offence: "offense", licence: "license", pretence: "pretense", grey: "gray", tyre: "tire",
  tyres: "tires", cheque: "check", plough: "plow", mould: "mold", moustache: "mustache", pyjamas: "pajamas",
  aluminium: "aluminum", aeroplane: "airplane", manoeuvre: "maneuver", oestrogen: "estrogen", paediatric: "pediatric",
  encyclopaedia: "encyclopedia", sceptical: "skeptical", storey: "story", practise: "practice", enrol: "enroll",
  fulfil: "fulfill", skilful: "skillful", wilful: "willful", ageing: "aging", judgement: "judgment",
};
const CONTRACTIONS = [["won't", "will not"], ["can't", "can not"], ["cannot", "can not"], ["shan't", "shall not"],
  ["n't", " not"], ["'re", " are"], ["'m", " am"], ["'ll", " will"], ["'ve", " have"]];

function fold(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function replaceAll(s, a, b) { return s.split(a).join(b); }

function normalize(s) {
  s = fold(String(s).trim().toLowerCase());
  for (const [a, b] of [["’", "'"], ["‘", "'"], ["«", ""], ["»", ""], ["“", ""], ["”", ""], ['"', ""]]) s = replaceAll(s, a, b);
  for (const [a, b] of CONTRACTIONS) s = replaceAll(s, a, b);
  s = s.replace(/[,;:]/g, " ").replace(/\s+/g, " ").trim().replace(/[ .!?]+$/, "");
  return s.split(" ").map(w => UK_US[w] || w).join(" ");
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const Engine = {
  goodAnswer(ex) { return Array.isArray(ex.answer) ? ex.answer[0] : ex.answer; },
  check(ex, answer) {
    const expected = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
    if (ex.type === "qcm") return expected.map(a => String(a).trim()).includes(answer.trim());
    const n = normalize(answer);
    return expected.some(a => normalize(a) === n);
  },
  questionAudio(ex) {
    if (ex.audio) return ex.audio;
    if (ex.type === "order") return Engine.goodAnswer(ex);
    return ex.question.replace(/[«»“”]/g, "").split("___").join(", ");
  },
  pronText(ex) {
    if (ex.say) return ex.say;
    if (ex.type === "fill") return ex.question.split(" — ")[0].split("___").join(Engine.goodAnswer(ex));
    return Engine.goodAnswer(ex);
  },
  valid(e) {
    try {
      return ["qcm", "fill", "order", "speak"].includes(e.type) && e.question != null && !!e.answer &&
        LEVELS.includes(e.level) && !!e.cat && typeof e.explain === "object" && "fr" in e;
    } catch (_) { return false; }
  },

  /* Serie equilibree : on alterne les categories ; les echeances et les rates reviennent en priorite. */
  makeSession(pool, level, lastResults, opts) {
    const { cats, review, size = 10, oral = true, due = new Set() } = opts || {};
    const usable = pool.filter(e => oral || e.type !== "speak");
    let chosen;
    if (review) {
      let p = shuffle(usable.filter(e => due.has(e.id) || lastResults[e.id] === 0));
      p.sort((a, b) => (due.has(a.id) ? 0 : 1) - (due.has(b.id) ? 0 : 1));
      chosen = p.slice(0, size);
    } else {
      const p = usable.filter(e => e.level === level && (!cats || !cats.length || cats.includes(e.cat)));
      const groups = {};
      for (const e of p) (groups[e.cat] = groups[e.cat] || []).push(e);
      const queues = [];
      for (const g of Object.values(groups)) {
        const late = shuffle(g.filter(e => due.has(e.id)));
        const rest = g.filter(e => !due.has(e.id));
        const fresh = shuffle(rest.filter(e => !(e.id in lastResults)));
        const failed = shuffle(rest.filter(e => lastResults[e.id] === 0));
        const done = shuffle(rest.filter(e => lastResults[e.id] === 1));
        queues.push([...late.slice(0, 3), ...failed.slice(0, 2), ...fresh, ...failed.slice(2), ...late.slice(3), ...done]);
      }
      chosen = [];
      while (chosen.length < size && queues.some(q => q.length)) {
        shuffle(queues);
        for (const q of queues) if (q.length && chosen.length < size) chosen.push(q.shift());
      }
      shuffle(chosen);
    }
    return new Session(chosen, level);
  },

  makePlacement(pool, perLevel = 3) {
    const okCats = ["grammaire", "vocabulaire", "conjugaison", "expressions", "orthographe", "lecture"];
    const picked = [];
    for (const lv of PLACEMENT_LEVELS) {
      const p = pool.filter(e => e.level === lv && (e.type === "qcm" || e.type === "fill") && okCats.includes(e.cat) &&
        !e.dictation && !e.audio);
      const byCat = {};
      for (const e of p) (byCat[e.cat] = byCat[e.cat] || []).push(e);
      const cats = shuffle(Object.keys(byCat));
      const chosen = []; let i = 0;
      while (chosen.length < perLevel && cats.length) {
        const c = cats[i % cats.length];
        if (byCat[c].length) { chosen.push(byCat[c].splice(Math.floor(Math.random() * byCat[c].length), 1)[0]); i++; }
        else cats.splice(cats.indexOf(c), 1);
      }
      picked.push(...chosen);
    }
    const s = new Session(picked, "TEST");
    s.placement = true;
    return s;
  },

  placementLevel(results, need = 2) {
    const per = {};
    for (const [lv, ok] of results) { const a = per[lv] = per[lv] || [0, 0]; a[0] += ok ? 1 : 0; a[1] += 1; }
    for (const lv of PLACEMENT_LEVELS) if (per[lv] && per[lv][0] < Math.min(need, per[lv][1])) return [lv, per];
    return ["Expert", per];
  },

  EXAM_SECTIONS: [["co", ["ecoute", "prononciation"], 90], ["ce", ["lecture"], 90],
    ["ml", ["grammaire", "vocabulaire", "conjugaison", "orthographe", "expressions"], 45], ["eo", ["oral"], 60]],
  WRITING_MINUTES: { A1: 10, A2: 15, B1: 25, B2: 35, C1: 40, C2: 45 },
  EXAM_PASS: 50, EXAM_SECTION_MIN: 20,

  makeExam(pool, level, lastResults, { oral = true, perSection = 10, writingTask = null } = {}) {
    const picked = [], secs = []; let limit = 0;
    for (const [key, cats, spq] of Engine.EXAM_SECTIONS) {
      if (key === "eo" && !oral) continue;
      let p = pool.filter(e => e.level === level && cats.includes(e.cat) &&
        (key === "eo" ? e.type === "speak" : (e.type === "qcm" || e.type === "fill")));
      if (key === "co") p = p.filter(e => e.audio);
      else if (key === "ce" || key === "ml") p = p.filter(e => !e.audio && !e.dictation);
      shuffle(p);
      p.sort((a, b) => ((a.id in lastResults) ? 1 : 0) - ((b.id in lastResults) ? 1 : 0));
      let chosen;
      if (key === "ml") {
        const groups = {};
        for (const e of p) (groups[e.cat] = groups[e.cat] || []).push(e);
        chosen = [];
        while (chosen.length < perSection && Object.values(groups).some(g => g.length))
          for (const g of Object.values(groups)) if (g.length && chosen.length < perSection) chosen.push(g.shift());
      } else chosen = p.slice(0, perSection);
      picked.push(...chosen);
      chosen.forEach(() => secs.push(key));
      limit += spq * chosen.length;
    }
    if (writingTask) {
      picked.push(Writing.asExercise(writingTask)); secs.push("ew");
      limit += (Engine.WRITING_MINUTES[level] || 30) * 60;
    }
    const s = new Session(picked, level);
    s.exam = true; s.sec = secs; s.limit = limit;
    return s;
  },

  examReport(s) {
    const per = {};
    s.sec.forEach((key, i) => {
      const a = per[key] = per[key] || [0, 0];
      if (key === "ew") { a[0] = s.wres[i] ? s.wres[i].total : 0; a[1] = 25; return; }
      a[1] += 1;
      if (s.log[i] && s.log[i][1]) a[0] += 1;
    });
    const pcts = {};
    for (const [k, [c, n]] of Object.entries(per)) pcts[k] = n ? Math.round(100 * c / n) : 0;
    const vals = Object.values(pcts);
    const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const passed = total >= Engine.EXAM_PASS && vals.every(p => p >= Engine.EXAM_SECTION_MIN);
    return { sections: per, pcts, total, passed };
  },
};

class Session {
  constructor(exercises, level) {
    this.exercises = exercises; this.level = level; this.idx = 0; this.correct = 0;
    this.results = []; this.t0 = Date.now(); this.tEx = Date.now();
    this.pron = []; this.sec = []; this.log = {}; this.wres = {};
    this.placement = false; this.exam = false; this.limit = 0;
  }
  current() { return this.exercises[this.idx]; }
  submit(ok) {
    this.results.push([this.exercises[this.idx].level, !!ok]);
    this.correct += ok ? 1 : 0;
    return (Date.now() - this.tEx) / 1000;
  }
  advance() { this.idx++; this.tEx = Date.now(); return this.idx < this.exercises.length; }
  get total() { return this.exercises.length; }
  get duration() { return (Date.now() - this.t0) / 1000; }
}

/* ------------------------------------------------------------------ prononciation (pronun.py) */
const Pronun = {
  PASS: 70, GREEN: 85, ORANGE: 50,
  SPOKEN: { mr: "mister", mrs: "missus", ms: "miz", dr: "doctor", ok: "okay", tv: "t v", uk: "u k", us: "us", usa: "u s a", "&": "and", "%": "percent" },
  wordsOf(text) {
    let t = String(text).toLowerCase().replace(/[’‘]/g, "'").replace(/[«»"“”.,;:!?¿…()\[\]\/]/g, " ").replace(/-/g, " ");
    const out = [];
    for (let w of t.split(/\s+/)) {
      w = w.replace(/^'+|'+$/g, "");
      if (!w) continue;
      w = UK_US[w] || w; w = Pronun.SPOKEN[w] || w;
      out.push(...w.replace(/'/g, " ").split(/\s+/).filter(Boolean));
    }
    return out;
  },
  /* difflib.SequenceMatcher(None, a, b).ratio() (Ratcliff/Obershelp) */
  ratio(a, b) {
    if (!a.length && !b.length) return 1;
    const m = (a1, a2, b1, b2) => {
      let best = 0, bi = 0, bj = 0;
      for (let i = a1; i < a2; i++) for (let j = b1; j < b2; j++) {
        let k = 0; while (i + k < a2 && j + k < b2 && a[i + k] === b[j + k]) k++;
        if (k > best) { best = k; bi = i; bj = j; }
      }
      if (!best) return 0;
      return best + m(a1, bi, b1, bj) + m(bi + best, a2, bj + best, b2);
    };
    return 2 * m(0, a.length, 0, b.length) / (a.length + b.length);
  },
  wordSim(a, b) {
    if (a === b) return 1;
    const fa = fold(a), fb = fold(b);
    if (fa === fb) return 0.85;
    const r = Pronun.ratio(fa, fb);
    return r >= 0.6 ? Math.round(0.6 * r * 1000) / 1000 : 0;
  },
  align(target, heard) {
    const n = target.length, m = heard.length;
    const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    const back = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
    for (let i = 1; i <= n; i++) back[i][0] = "del";
    for (let j = 1; j <= m; j++) back[0][j] = "ins";
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const sim = Pronun.wordSim(target[i - 1], heard[j - 1]);
      const opts = [[best[i - 1][j - 1] + sim, "sub"], [best[i - 1][j], "del"], [best[i][j - 1] - 0.15, "ins"]];
      let o = opts[0]; for (const x of opts) if (x[0] > o[0]) o = x;
      best[i][j] = o[0]; back[i][j] = o[1];
    }
    const out = new Array(n).fill(null); let extra = 0, i = n, j = m;
    while (i > 0 || j > 0) {
      const step = back[i][j];
      if (step === "sub") {
        const s = Pronun.wordSim(target[i - 1], heard[j - 1]);
        out[i - 1] = [s, s > 0 ? heard[j - 1] : null];
        if (s === 0) extra++;
        i--; j--;
      } else if (step === "del") { out[i - 1] = [0, null]; i--; }
      else { extra++; j--; }
    }
    return [out, extra];
  },
  score(targetText, heardText) {
    const target = Pronun.wordsOf(targetText), heard = Pronun.wordsOf(heardText || "");
    if (!target.length || !heard.length)
      return { percent: 0, words: target.map(w => [w, 0, null]), heard: heardText || "", extra: 0, verdict: "retry", silent: true };
    const [aligned, extra] = Pronun.align(target, heard);
    const weights = target.map(w => Math.max(fold(w).length, 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let raw = weights.reduce((s, wt, k) => s + wt * aligned[k][0], 0) / total;
    raw -= Math.min(0.25, 0.05 * extra);
    const pct = Math.max(0, Math.min(100, Math.round(100 * raw)));
    return { percent: pct, words: target.map((w, k) => [w, aligned[k][0], aligned[k][1]]), heard: heard.join(" "),
      extra, verdict: Pronun.verdict(pct), silent: false };
  },
  verdict(p) { return p >= 90 ? "excellent" : p >= Pronun.PASS ? "good" : p >= 50 ? "medium" : "retry"; },
  color(s) { const v = s * 100; return v >= Pronun.GREEN ? "#16A34A" : v >= Pronun.ORANGE ? "#D97706" : "#DC2626"; },
};

/* ------------------------------------------------------------------ expression ecrite (writing.py) */
const Writing = {
  CRITERIA: [["consigne", 10], ["longueur", 4], ["connecteurs", 4], ["lexique", 4], ["structure", 3]],
  LABELS: {
    consigne: { fr: "Respect de la consigne", en: "Task achievement" },
    longueur: { fr: "Longueur", en: "Length" },
    connecteurs: { fr: "Mots de liaison", en: "Linking words" },
    lexique: { fr: "Variété du vocabulaire", en: "Range of vocabulary" },
    structure: { fr: "Structure et formules", en: "Organization and set phrases" },
  },
  CONNECTORS: ("and|but|or|so|then|because|also|first|firstly|second|secondly|finally|after that|next|however|" +
    "although|though|even though|for example|for instance|such as|moreover|furthermore|in addition|" +
    "besides|therefore|thus|consequently|as a result|on the other hand|on the one hand|in contrast|" +
    "whereas|while|nevertheless|nonetheless|despite|in spite of|unless|in conclusion|to conclude|" +
    "to sum up|all in all|overall|in short|indeed|in fact|actually|meanwhile|since|as long as|" +
    "in order to|so that|not only|as well as|instead|otherwise|hence|likewise|similarly|what is more|" +
    "to begin with|last but not least|above all|in my opinion|personally|admittedly|that said|" +
    "by contrast|notwithstanding|insofar as|to a certain extent|it follows that|in other words").split("|"),
  NEED: { A1: 1, A2: 2, B1: 3, B2: 5, C1: 6, C2: 7 },
  TTR: { A1: 0.5, A2: 0.5, B1: 0.55, B2: 0.6, C1: 0.62, C2: 0.65 },
  OPENERS: "dear|hi|hello|hey|to whom it may concern|good morning|good afternoon".split("|"),
  CLOSERS: ("best wishes|best regards|kind regards|regards|yours sincerely|yours faithfully|sincerely|love|" +
    "see you|take care|bye|cheers|write soon|thanks again|thank you in advance|look forward|" +
    "looking forward|all the best|talk soon").split("|"),
  INTRO: ("nowadays|these days|today|in recent years|more and more|it is often said|many people|some people|" +
    "the question|to what extent|is it|should we|can we|it is widely|there is no doubt|this essay|" +
    "this report|the aim of|the purpose of").split("|"),
  CONCL: ("in conclusion|to conclude|to sum up|all in all|overall|in short|finally|to summarize|to summarise|" +
    "taking everything into account|on balance|in the end|for these reasons").split("|"),
  SELF_CHECK: [
    { fr: "Chaque phrase a un sujet et un verbe (pas de sujet oublié : « It is… », pas « Is… »).", en: "Every sentence has a subject and a verb (no missing subject: “It is…”, not “Is…”)." },
    { fr: "J'ai mis le -s de la 3e personne au présent (he works, she has).", en: "I added the third-person -s in the present (he works, she has)." },
    { fr: "J'ai vérifié les temps (prétérit pour un moment fini du passé, present perfect pour un lien avec le présent).", en: "I checked the tenses (past simple for finished time, present perfect for a link with now)." },
    { fr: "J'ai vérifié l'ordre des mots (adjectif avant le nom, pas d'adverbe entre le verbe et son complément).", en: "I checked word order (adjective before the noun, no adverb between the verb and its object)." },
    { fr: "Le registre est cohérent (formules de politesse, pas de contractions dans une lettre formelle).", en: "The register is consistent (polite formulas, no contractions in a formal letter)." },
  ],
  tasks: [], known: null,
  norm(s) { return String(s).toLowerCase().replace(/[’‘]/g, "'"); },
  esc(p) { return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); },
  wordsOf(t) { return Writing.norm(t).match(/[a-z]+(?:'[a-z]+)*/g) || []; },
  has(textN, list) { return list.filter(p => new RegExp("(?<![a-z])" + Writing.esc(p) + "(?![a-z])").test(textN)); },
  pickTask(level, exclude = []) {
    const pool = Writing.tasks.filter(t => t.level === level);
    const fresh = pool.filter(t => !exclude.includes(t.id));
    const p = fresh.length ? fresh : pool;
    return p.length ? p[Math.floor(Math.random() * p.length)] : null;
  },
  asExercise(task) {
    return { id: task.id, level: task.level, theme: "ecrit", cat: "ecrit", type: "write", question: task.en, fr: task.fr,
      answer: "", explain: { fr: "", en: "" }, task };
  },
  baseForms(w) {
    const out = new Set([w]);
    for (const [suf, rep] of [["ies", "y"], ["ied", "y"], ["ier", "y"], ["iest", "y"], ["ily", "y"], ["es", ""], ["s", ""],
      ["ed", ""], ["ed", "e"], ["d", ""], ["ing", ""], ["ing", "e"], ["ly", ""], ["er", ""], ["er", "e"], ["est", ""],
      ["est", "e"], ["ness", ""], ["ment", ""], ["ful", ""], ["less", ""]]) {
      if (w.endsWith(suf) && w.length - suf.length >= 2) {
        const b = w.slice(0, w.length - suf.length) + rep;
        out.add(b);
        if (b.length >= 3 && b[b.length - 1] === b[b.length - 2] && !rep) out.add(b.slice(0, -1));
      }
    }
    return out;
  },
  unknownWords(text, limit = 10) {
    const k = Writing.known;
    if (!k || !k.size) return [];
    const out = [], seen = new Set();
    const re = /[A-Za-z]+(?:['’][A-Za-z]+)*/g; let m;
    while ((m = re.exec(text))) {
      const raw = m[0], full = Writing.norm(raw), w = full.split("'")[0];
      const before = text.slice(0, m.index).trimEnd();
      const start = m.index === 0 || ".!?\n:".includes(before.slice(-1)) || !before.length;
      if (w.length < 4 || seen.has(w) || (raw[0] !== raw[0].toLowerCase() && !start)) continue;
      if (k.has(full) || [...Writing.baseForms(w)].some(b => k.has(b))) continue;
      seen.add(w); out.push(raw);
      if (out.length >= limit) break;
    }
    return out;
  },
  score(task, text) {
    const level = task.level; text = text || "";
    const nText = Writing.norm(text), ws = Writing.wordsOf(text), n = ws.length;
    let pts = {};
    const els = task.elements, found = [];
    for (const el of els) {
      const pats = el.kw.split("|");
      if (pats.some(p => {
        const isRe = /[\\?+*\[(]/.test(p);
        try { return new RegExp(isRe ? p : "(?<![a-z])" + Writing.esc(p)).test(nText); } catch (_) { return nText.includes(p); }
      })) found.push(el);
    }
    pts.consigne = els.length ? Math.round(100 * found.length / els.length) / 10 : 0;
    const mn = task.min, mx = task.max;
    if (n >= mn && n <= mx * 1.3) pts.longueur = 4;
    else if (n > mx * 1.3) pts.longueur = 2;
    else pts.longueur = n > 0.4 * mn ? Math.round(40 * Math.max(0, n - 0.4 * mn) / (0.6 * mn)) / 10 : 0;
    const conns = Writing.has(nText, Writing.CONNECTORS);
    const need = Writing.NEED[level] || 3;
    pts.connecteurs = Math.round(40 * Math.min(1, new Set(conns).size / need)) / 10;
    const content = ws.filter(w => w.length > 2);
    const ttr = content.length ? new Set(content).size / content.length : 0;
    pts.lexique = n >= 0.5 * mn ? Math.round(40 * Math.min(1, ttr / (Writing.TTR[level] || 0.55))) / 10
      : Math.round(20 * Math.min(1, ttr / 0.55)) / 10;
    const form = task.form || "essay"; let s = 0;
    const paras = text.split(/\n\s*\n|\n/).filter(p => p.trim());
    if (form === "letter" || form === "message") {
      if (Writing.has(nText, Writing.OPENERS).length) s += 1;
      if (Writing.has(nText, Writing.CLOSERS).length) s += 1;
      if (n && (".!?)".includes(text.trim().slice(-1)) || paras.length > 1)) s += 1; else if (n) s += 0.5;
    } else {
      if (Writing.has(nText, Writing.INTRO).length) s += 1;
      if (Writing.has(nText, Writing.CONCL).length) s += 1;
      if (paras.length >= 2 || (text.match(/[.!?]/g) || []).length >= 6) s += 1;
    }
    pts.structure = s;
    if (n === 0) pts = { consigne: 0, longueur: 0, connecteurs: 0, lexique: 0, structure: 0 };
    const total = Math.round(10 * Object.values(pts).reduce((a, b) => a + b, 0)) / 10;
    return { pts, total, pct: Math.round(100 * total / 25), words: n, found, missing: els.filter(e => !found.includes(e)),
      connectors: [...new Set(conns)].sort(), unknown: n ? Writing.unknownWords(text) : [] };
  },
};
