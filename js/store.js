/* Stockage local (sur le telephone) : profils, progression, revision espacee, exercices personnels.
   Remplace la base SQLite de la version Windows (app/db.py, app/profiles.py). */
"use strict";

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { console.warn("stockage", e); if (window.App) App.toast(App.t("w_storage_full")); return false; }
  },
  del(k) { try { localStorage.removeItem(k); } catch (_) { /* rien */ } },
};

const EMOJIS = ["🙂", "😎", "🐱", "🐼", "🦊", "🌸", "⭐", "🚀", "🎨", "🍀"];
const INTERVALS = [0, 1, 3, 7, 21, 60];   // boites de Leitner (jours)

function today(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const Cfg = {
  data: null,
  load() {
    this.data = Object.assign({ profiles: [], last: null, lang: "fr", showTr: true, sound: true, oral: true,
      accent: "en-US", rate: 0.95 }, LS.get("eaf.cfg", {}));
    if (!["fr", "en"].includes(this.data.lang)) this.data.lang = "fr";
    return this.data;
  },
  save() { LS.set("eaf.cfg", this.data); },
};

function newProfileData() {
  return { settings: { cats: null, size: 10, levelRec: null, writingDone: [], lastLevel: null },
    srs: {}, last: {}, sessions: [], byLevel: {}, byCat: {}, byTheme: {}, errors: {},
    pronWords: {}, pronHist: [], nAnswers: 0, nCorrect: 0 };
}

const Profiles = {
  list() { return Cfg.data.profiles; },
  add(name, emoji) {
    name = (name || "").trim();
    if (!name || Cfg.data.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) return null;
    const p = { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, emoji: emoji || "🙂" };
    Cfg.data.profiles.push(p); Cfg.data.last = p.id; Cfg.save();
    LS.set("eaf.prof." + p.id, newProfileData());
    return p;
  },
  remove(id) {
    Cfg.data.profiles = Cfg.data.profiles.filter(p => p.id !== id);
    LS.del("eaf.prof." + id);
    if (Cfg.data.last === id) Cfg.data.last = Cfg.data.profiles[0] ? Cfg.data.profiles[0].id : null;
    Cfg.save();
  },
  removeAll() { for (const p of Cfg.data.profiles) LS.del("eaf.prof." + p.id); Cfg.data.profiles = []; Cfg.data.last = null; Cfg.save(); },
};

/* Progression du profil courant */
const DB = {
  prof: null, d: null,
  open(prof) {
    this.prof = prof;
    this.d = Object.assign(newProfileData(), LS.get("eaf.prof." + prof.id, {}));
    this.d.settings = Object.assign(newProfileData().settings, this.d.settings || {});
    Cfg.data.last = prof.id; Cfg.save();
  },
  save() { if (this.prof) LS.set("eaf.prof." + this.prof.id, this.d); },
  setting(k, v) { if (v === undefined) return this.d.settings[k]; this.d.settings[k] = v; this.save(); },

  startSession(level, mode) { return { started: new Date().toISOString(), level, mode }; },
  endSession(sess, duration, total, correct) {
    if (!total) return;
    this.d.sessions.push({ d: sess.started, dur: Math.round(duration), lv: sess.level, mode: sess.mode, n: total, c: correct });
    if (this.d.sessions.length > 400) this.d.sessions.splice(0, this.d.sessions.length - 400);
    this.save();
  },
  record(ex, ok, userAnswer, seconds, pron) {
    const d = this.d, c = ok ? 1 : 0;
    const bump = (obj, k) => { const a = obj[k] = obj[k] || [0, 0]; a[0]++; a[1] += c; };
    bump(d.byLevel, ex.level); bump(d.byCat, ex.cat); bump(d.byTheme, ex.theme);
    d.nAnswers++; d.nCorrect += c;
    d.last[ex.id] = c;
    if (!ok) {
      const e = d.errors[ex.id] = d.errors[ex.id] || [0, "", ex.cat];
      e[0]++; e[1] = String(ex.question).replace(/\s+/g, " ").slice(-90);
      const keys = Object.keys(d.errors);
      if (keys.length > 600) { keys.sort((a, b) => d.errors[a][0] - d.errors[b][0]); for (const k of keys.slice(0, 100)) delete d.errors[k]; }
    }
    // revision espacee (Leitner)
    const prev = d.srs[ex.id];
    const box = !ok ? 0 : Math.min((prev ? prev[0] : 0) + 1, INTERVALS.length - 1);
    d.srs[ex.id] = [box, today(INTERVALS[box])];
    if (pron != null) { d.pronHist.push(pron); if (d.pronHist.length > 200) d.pronHist.shift(); }
    this.save();
  },
  recordPronWords(words) {
    for (const [w, sc] of words) { const a = this.d.pronWords[w] = this.d.pronWords[w] || [0, 0]; a[0]++; a[1] += sc; }
    this.save();
  },
  dueIds() { const t = today(); return new Set(Object.entries(this.d.srs).filter(([, v]) => v[1] <= t).map(([k]) => k)); },
  srsBoxes() { const b = {}; for (const v of Object.values(this.d.srs)) b[v[0]] = (b[v[0]] || 0) + 1; return b; },
  toReviewCount() {
    const due = this.dueIds();
    for (const [k, v] of Object.entries(this.d.last)) if (v === 0) due.add(k);
    return due.size;
  },
  worstWords(n = 15) {
    return Object.entries(this.d.pronWords).map(([w, [t, s]]) => [w, t, Math.round(100 * s / t)])
      .filter(r => r[2] < 100).sort((a, b) => a[2] - b[2] || b[1] - a[1]).slice(0, n);
  },
  pronAverage() { const h = this.d.pronHist; return h.length ? [Math.round(h.reduce((a, b) => a + b, 0) / h.length), h.length] : [null, 0]; },
};

/* Exercices personnels (« Mes exercices ») : communs a tous les profils, comme dans la version Windows */
const Custom = {
  list: [],
  load() { this.list = (LS.get("eaf.custom", []) || []).filter(e => Engine.valid(e)); return this.list; },
  save() { LS.set("eaf.custom", this.list); },
  nextId() {
    const nums = this.list.map(e => /^C-(\d+)$/.exec(e.id)).filter(Boolean).map(m => +m[1]);
    return "C-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
  },
  add(ex) { ex = Object.assign({}, ex, { id: this.nextId(), theme: "perso" }); this.list.push(ex); this.save(); return ex.id; },
  remove(id) { this.list = this.list.filter(e => e.id !== id); this.save(); },
  importList(data) {
    let n = 0;
    for (const e of Array.isArray(data) ? data : []) if (Engine.valid(e)) { this.add(e); n++; }
    return n;
  },
};
