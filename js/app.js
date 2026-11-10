/* Exercice d'Anglais pour Français — version mobile (application web hors ligne).
   Interface : port de app/ui.py (PySide6) vers HTML/JS. */
"use strict";

const DATA_CACHE = "eaf-data-v1";
const DATA_FILES = ["data/a1.json", "data/a2.json", "data/b1.json", "data/b2.json", "data/c1.json", "data/c2.json",
  "data/expert.json", "data/writing_tasks.json", "data/words.txt"];
const LEVEL_COLORS = { A1: "#22C55E", A2: "#14B8A6", B1: "#3B82F6", B2: "#8B5CF6", C1: "#F59E0B", C2: "#EF4444", Expert: "#1E293B" };
const PALETTE = ["#3B82F6", "#EC4899", "#F59E0B", "#22C55E"];

/* Textes propres a la version mobile (les autres viennent de app/i18n.py via data/meta.json) */
const W = {
  w_offline_ready: { fr: "✅ Disponible hors ligne", en: "✅ Available offline" },
  w_offline_dl: { fr: "📥 Préparation du mode hors ligne… {p} %", en: "📥 Preparing offline mode… {p}%" },
  w_offline_fail: { fr: "⚠️ Mode hors ligne incomplet : rouvrez l'appli avec Internet une fois.", en: "⚠️ Offline mode incomplete: open the app once with Internet." },
  w_loading: { fr: "Chargement des exercices…", en: "Loading exercises…" },
  w_load_fail: { fr: "Impossible de charger les exercices. Ouvrez l'application une première fois avec Internet.", en: "Could not load the exercises. Open the app once with Internet." },
  w_install: { fr: "📲 Installer l'application sur ce téléphone", en: "📲 Install the app on this phone" },
  w_install_ios: { fr: "📲 Pour l'installer sur iPhone : touchez Partager ⬆️ puis « Sur l'écran d'accueil ».", en: "📲 To install on iPhone: tap Share ⬆️ then “Add to Home Screen”." },
  w_menu: { fr: "Menu", en: "Menu" },
  w_settings: { fr: "Réglages", en: "Settings" },
  w_oral: { fr: "Exercices oraux (micro)", en: "Speaking exercises (mic)" },
  w_no_sr: { fr: "La reconnaissance vocale n'existe pas dans ce navigateur : les exercices oraux sont désactivés. Utilisez Chrome (Android) ou Safari (iPhone).", en: "Speech recognition is not available in this browser: speaking exercises are turned off. Use Chrome (Android) or Safari (iPhone)." },
  w_sr_network: { fr: "La reconnaissance vocale de ce téléphone a besoin d'Internet (ou de la langue anglaise téléchargée pour la dictée hors ligne). Réessayez avec Internet ou passez l'exercice.", en: "This phone's speech recognition needs Internet (or English downloaded for offline dictation). Try again online or skip this exercise." },
  w_sr_denied: { fr: "Micro refusé. Autorisez le micro pour cette application dans les réglages du navigateur.", en: "Microphone blocked. Allow the microphone for this app in the browser settings." },
  w_skip: { fr: "Passer ➜", en: "Skip ➜" },
  w_speed: { fr: "Vitesse de la voix", en: "Voice speed" },
  w_print: { fr: "🖨 Imprimer / enregistrer en PDF", en: "🖨 Print / save as PDF" },
  w_storage_full: { fr: "Mémoire pleine : la progression n'a pas pu être enregistrée.", en: "Storage full: progress could not be saved." },
  w_cancel: { fr: "Annuler", en: "Cancel" }, w_ok: { fr: "OK", en: "OK" }, w_yes: { fr: "Oui", en: "Yes" }, w_no: { fr: "Non", en: "No" },
  w_back: { fr: "← Retour", en: "← Back" },
  w_start: { fr: "Commencer", en: "Start" },
  w_series: { fr: "Votre série", en: "Your series" },
  w_learn: { fr: "Apprendre", en: "Learn" }, w_eval: { fr: "Évaluer", en: "Assess" },
  w_due: { fr: "{n} à réviser", en: "{n} to review" },
  w_none: { fr: "Rien pour l'instant", en: "Nothing yet" },
  w_voice_none: { fr: "Aucune voix anglaise trouvée sur ce téléphone : le texte est lu avec la voix par défaut. Android : Paramètres › Accessibilité › Synthèse vocale (installez l'anglais). iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Anglais.", en: "No English voice found on this phone: the default voice is used. Android: Settings › Accessibility › Text-to-speech (install English). iPhone: Settings › Accessibility › Spoken Content › Voices › English." },
  w_voice_used: { fr: "Voix utilisée", en: "Voice used" },
  w_about_web: { fr: "Version mobile (application web) : fonctionne hors ligne après la première ouverture. Votre progression reste sur ce téléphone (pensez à « Sauvegarder mon profil »). Les vraies photos ne sont pas incluses : les images sont des emojis.", en: "Mobile version (web app): works offline after the first launch. Your progress stays on this phone (use “Save my profile”). Real photos are not included: pictures are emojis." },
  w_choose_emoji: { fr: "Choisissez un avatar :", en: "Choose an avatar:" },
  w_mine_n: { fr: "Mes exercices ({n})", en: "My exercises ({n})" },
  w_rec_start: { fr: "Commencer au niveau {lv}", en: "Start level {lv}" },
  w_tap_word: { fr: "Touchez un mot pour l'enlever.", en: "Tap a word to remove it." },
  w_quit_series: { fr: "Quitter la série en cours ?", en: "Leave the current series?" },
  w_sentence_ph: { fr: "Votre phrase s'affiche ici", en: "Your sentence appears here" },
  w_pron_best: { fr: "Meilleur essai retenu parmi les propositions du téléphone.", en: "Best match kept among the phone's guesses." },
  w_restored: { fr: "Profil restauré :", en: "Profile restored:" },
  w_update: { fr: "Application mise à jour ✅", en: "App updated ✅" },
  w_cert_level: { fr: "Niveau", en: "Level" },
  w_series_size: { fr: "Exercices par série", en: "Exercises per series" },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl2br = s => esc(s).replace(/\n/g, "<br>");

const App = {
  meta: null, data: {}, session: null, view: "", L: "fr", speechOK: false, voices: [], installEvt: null,
  offline: { state: "?", pct: 0 }, examTimer: null, deadline: 0,

  /* ------------------------------------------------------------------ textes */
  t(key, vars) {
    const d = W[key] || (this.meta && this.meta.S[key]) || {};
    let s = d[this.L] || d.fr || key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split("{" + k + "}").join(v);
    return s;
  },
  catName(k) { const c = this.meta.cats[k]; return c ? (c[this.L] || c.fr) : (k === "ecrit" ? this.t("writing_mode") : k); },
  catEmoji(k) { return (this.meta.cats[k] || {}).emoji || "✍️"; },
  themeName(k) { const t = this.meta.themes[k]; return t ? (t[this.L] || t.fr) : (k === "perso" ? this.t("m_mine") : k); },
  levelDesc(lv) { const d = this.meta.levelDesc[lv]; return d ? d[this.L] : lv; },

  /* ------------------------------------------------------------------ demarrage */
  async init() {
    Cfg.load(); this.L = Cfg.data.lang;
    document.documentElement.lang = this.L;
    try { this.meta = await (await fetch("data/meta.json")).json(); }
    catch (e) { document.body.innerHTML = "<p style='padding:24px'>Erreur de chargement. Rechargez la page.</p>"; return; }
    Custom.load();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechOK = !!SR;
    this.initVoices();
    this.registerSW();
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); this.installEvt = e; if (this.view === "home") this.showHome(); });
    window.addEventListener("popstate", () => this.onBack());
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) { /* rien */ }
    const last = Cfg.data.profiles.find(p => p.id === Cfg.data.last);
    if (last) { DB.open(last); this.showHome(); } else this.showProfiles(true);
  },

  registerSW() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") { this.offline.state = "fail"; return; }
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && !reloaded) { reloaded = true; this.toast(this.t("w_update")); }
    });
    navigator.serviceWorker.register("sw.js").then(() => this.precacheData()).catch(() => { this.offline.state = "fail"; this.refreshOffline(); });
  },

  /* Telecharge toutes les donnees dans le cache (avec progression) pour le mode hors ligne */
  async precacheData() {
    if (!("caches" in window)) { this.offline.state = "fail"; return; }
    try {
      const cache = await caches.open(DATA_CACHE);
      const missing = [];
      for (const f of DATA_FILES) if (!(await cache.match(f))) missing.push(f);
      if (!missing.length) { this.offline.state = "ok"; this.refreshOffline(); return; }
      this.offline.state = "dl"; let done = DATA_FILES.length - missing.length;
      this.offline.pct = Math.round(100 * done / DATA_FILES.length); this.refreshOffline();
      for (const f of missing) {
        const r = await fetch(f, { cache: "no-cache" });
        if (!r.ok) throw new Error(f);
        await cache.put(f, r);
        done++; this.offline.pct = Math.round(100 * done / DATA_FILES.length); this.refreshOffline();
      }
      this.offline.state = "ok";
    } catch (e) { this.offline.state = "fail"; }
    this.refreshOffline();
  },
  offlineText() {
    const o = this.offline;
    return o.state === "ok" ? this.t("w_offline_ready") : o.state === "dl" ? this.t("w_offline_dl", { p: o.pct }) :
      o.state === "fail" ? this.t("w_offline_fail") : "";
  },
  refreshOffline() { const e = $("#offline"); if (e) { e.textContent = this.offlineText(); e.className = "chip offline " + this.offline.state; } },

  async loadLevel(lv) {
    if (this.data[lv]) return this.data[lv];
    const r = await fetch("data/" + lv.toLowerCase() + ".json");
    if (!r.ok) throw new Error("load " + lv);
    this.data[lv] = await r.json();
    return this.data[lv];
  },
  async withLoading(fn) {
    const ov = document.createElement("div");
    ov.className = "loading"; ov.innerHTML = `<div class="spinner"></div><p>${esc(this.t("w_loading"))}</p>`;
    document.body.appendChild(ov);
    try { return await fn(); }
    catch (e) { console.error(e); await this.alert(this.t("w_load_fail")); return null; }
    finally { ov.remove(); }
  },
  async pool(levels) {
    const out = [];
    for (const lv of levels) out.push(...await this.loadLevel(lv));
    out.push(...Custom.list.filter(e => levels.includes(e.level)));
    return out;
  },
  async loadWriting() {
    if (!Writing.tasks.length) Writing.tasks = await (await fetch("data/writing_tasks.json")).json();
    if (!Writing.known) {
      fetch("data/words.txt").then(r => r.text()).then(t => { Writing.known = new Set(t.split(/\s+/)); }).catch(() => {});
    }
  },
  oralOn() { return this.speechOK && Cfg.data.oral; },

  /* ------------------------------------------------------------------ navigation */
  render(view, html, opts = {}) {
    this.view = view;
    const root = $("#app");
    root.innerHTML = html;
    root.className = "view-" + view;
    window.scrollTo(0, 0);
    if (view !== "home" && view !== "profiles" && !history.state) history.pushState({ v: view }, "");
    if ((view === "home" || view === "profiles") && history.state) { this._skipPop = true; history.back(); }
    return root;
  },
  onBack() {
    if (this._skipPop) { this._skipPop = false; return; }
    const m = $(".modal-back");
    if (m) { m.remove(); history.pushState({ v: this.view }, ""); return; }
    if (this.view === "exercise") {
      history.pushState({ v: this.view }, "");
      this.leaveExercise();
      return;
    }
    if (this.view !== "home" && this.view !== "profiles") { this.view = ""; this.showHome(); }
  },

  /* ------------------------------------------------------------------ petites fenetres */
  modal(inner, { cls = "" } = {}) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal ${cls}" role="dialog">${inner}</div>`;
    document.body.appendChild(back);
    return back;
  },
  alert(msg) {
    return new Promise(res => {
      const m = this.modal(`<p class="pre">${nl2br(msg)}</p><div class="row end"><button class="btn primary" data-ok>${esc(this.t("w_ok"))}</button></div>`);
      $("[data-ok]", m).onclick = () => { m.remove(); res(); };
    });
  },
  confirm(msg) {
    return new Promise(res => {
      const m = this.modal(`<p class="pre">${nl2br(msg)}</p><div class="row end"><button class="btn ghost" data-no>${esc(this.t("w_no"))}</button><button class="btn primary" data-yes>${esc(this.t("w_yes"))}</button></div>`);
      $("[data-yes]", m).onclick = () => { m.remove(); res(true); };
      $("[data-no]", m).onclick = () => { m.remove(); res(false); };
    });
  },
  pickLevel(title, levels, def) {
    return new Promise(res => {
      const m = this.modal(`<h3>${esc(title)}</h3><div class="level-pick">${levels.map(lv =>
        `<button class="lvbtn ${lv === def ? "sel" : ""}" style="--c:${LEVEL_COLORS[lv]}" data-lv="${lv}"><b>${lv}</b><small>${esc(this.levelDesc(lv))}</small></button>`).join("")}</div>
        <div class="row end"><button class="btn ghost" data-no>${esc(this.t("w_cancel"))}</button></div>`);
      $$("[data-lv]", m).forEach(b => b.onclick = () => { m.remove(); res(b.dataset.lv); });
      $("[data-no]", m).onclick = () => { m.remove(); res(null); };
    });
  },
  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 2800);
  },

  /* ------------------------------------------------------------------ son et voix */
  sfx(name) {
    if (!Cfg.data.sound) return;
    try { const a = new Audio("sounds/" + name + ".mp3"); a.volume = 0.6; a.play().catch(() => {}); } catch (_) { /* rien */ }
  },
  initVoices() {
    if (!("speechSynthesis" in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang) || v.lang === "en"); };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  pickVoice() {
    const acc = Cfg.data.accent.toLowerCase();
    const norm = v => v.lang.replace("_", "-").toLowerCase();
    const same = this.voices.filter(v => norm(v) === acc);
    const pool = same.length ? same : this.voices;
    return pool.find(v => v.localService) || pool[0] || null;
  },
  speak(text, slow = false) {
    if (!("speechSynthesis" in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pickVoice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : Cfg.data.accent;
      u.rate = slow ? Math.max(0.4, Cfg.data.rate * 0.6) : Cfg.data.rate;
      speechSynthesis.speak(u);
    } catch (_) { /* rien */ }
  },

  /* ------------------------------------------------------------------ profils */
  showProfiles(first = false) {
    const profs = Profiles.list();
    let emoji = EMOJIS[0];
    const root = this.render("profiles", `
      <div class="page narrow">
        <div class="hero"><img src="icons/icon-192.png" alt="" width="72" height="72"><h1>${esc(this.t("title"))}</h1></div>
        <h2>${esc(this.t("profile_title"))}</h2>
        <div class="profiles">${profs.map((p, i) => `
          <div class="prof-row"><button class="btn big prof" style="--c:${PALETTE[i % 4]}" data-open="${p.id}">${esc(p.emoji)}&nbsp; ${esc(p.name)}</button>
          <button class="btn icon ghost" data-del="${p.id}" aria-label="supprimer">🗑</button></div>`).join("")}
        </div>
        <div class="card">
          <h3>${esc(this.t("new_profile"))}</h3>
          <input id="pname" class="input" maxlength="30" placeholder="${esc(this.t("name_ph"))}" autocomplete="off">
          <p class="muted small">${esc(this.t("w_choose_emoji"))}</p>
          <div class="emojis">${EMOJIS.map((e, i) => `<button class="emo ${i ? "" : "sel"}" data-emo="${e}">${e}</button>`).join("")}</div>
          <button class="btn primary wide" id="pcreate">${esc(this.t("create"))}</button>
        </div>
        ${profs.length > 1 ? `<button class="btn ghost danger wide" id="pdelall">${esc(this.t("delete_all"))}</button>` : ""}
        <div class="row center"><select id="langsel" class="select">${[["fr", "Français"], ["en", "English"]].map(([k, n]) => `<option value="${k}" ${k === this.L ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      </div>`);
    $$("[data-emo]", root).forEach(b => b.onclick = () => { $$(".emo", root).forEach(x => x.classList.remove("sel")); b.classList.add("sel"); emoji = b.dataset.emo; });
    $$("[data-open]", root).forEach(b => b.onclick = () => { DB.open(Profiles.list().find(p => p.id === b.dataset.open)); this.showHome(true); });
    $$("[data-del]", root).forEach(b => b.onclick = async () => {
      const p = Profiles.list().find(x => x.id === b.dataset.del);
      if (await this.confirm(this.t("confirm_delete", { n: p.name }))) { Profiles.remove(p.id); this.showProfiles(); }
    });
    const create = () => {
      const p = Profiles.add($("#pname").value, emoji);
      if (!p) return this.alert(this.t("profile_exists"));
      DB.open(p); this.showHome(true);
    };
    $("#pcreate").onclick = create;
    $("#pname").onkeydown = e => { if (e.key === "Enter") create(); };
    const da = $("#pdelall"); if (da) da.onclick = async () => { if (await this.confirm(this.t("confirm_delete_all"))) { Profiles.removeAll(); this.showProfiles(true); } };
    $("#langsel").onchange = e => { this.setLang(e.target.value); this.showProfiles(); };
  },
  setLang(l) { this.L = Cfg.data.lang = l; document.documentElement.lang = l; Cfg.save(); },

  /* ------------------------------------------------------------------ accueil */
  selCats() { const c = DB.setting("cats"); return c && c.length ? c : this.meta.catKeys.slice(); },
  levelCount(lv, cats) {
    const c = this.meta.counts[lv] || {};
    let n = 0;
    for (const k of cats) if (k !== "oral" || this.oralOn()) n += c[k] || 0;
    n += Custom.list.filter(e => e.level === lv && cats.includes(e.cat)).length;
    return n;
  },
  showHome(offerPlacement = false) {
    const d = DB.d, cats = this.selCats(), size = DB.setting("size") || 10, rec = DB.setting("levelRec");
    const pct = d.nAnswers ? Math.round(100 * d.nCorrect / d.nAnswers) : 0;
    const nRev = DB.toReviewCount();
    const lastLv = DB.setting("lastLevel");
    const allCats = cats.length === this.meta.catKeys.length;
    const what = allCats ? this.t("all_cats") : cats.length === 1 ? this.catName(cats[0]) : this.t("n_cats", { n: cats.length });
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    const root = this.render("home", `
      <header class="topbar">
        <div class="brand"><img src="icons/icon-192.png" alt="" width="30" height="30"><span>${esc(this.t("title"))}</span></div>
        <button class="btn chip-btn" id="bprof">${esc(DB.prof.emoji)} ${esc(DB.prof.name)} ▾</button>
        <button class="btn icon" id="bmenu" aria-label="menu">☰</button>
      </header>
      <div class="page">
        <p class="welcome">${esc(this.t("welcome", { name: DB.prof.name }))}</p>
        <div class="row wrap"><span id="offline" class="chip offline ${this.offline.state}">${esc(this.offlineText())}</span></div>
        ${this.installEvt ? `<button class="btn install wide" id="binstall">${esc(this.t("w_install"))}</button>` : isIOS ? `<p class="hint">${esc(this.t("w_install_ios"))}</p>` : ""}
        <div class="stats">
          <div><b>${d.nAnswers}</b><span>${esc(this.t("answered"))}</span></div>
          <div><b>${pct} %</b><span>${esc(this.t("success_rate"))}</span></div>
          <div><b>${nRev}</b><span>${esc(this.t("to_review"))}</span></div>
        </div>
        <div class="quick">
          ${lastLv ? `<button class="btn big" style="--c:#2563EB" id="bresume">${esc(this.t("resume"))} <small>${lastLv}</small></button>` : ""}
          <button class="btn big" style="--c:#7C3AED" id="breview">${esc(this.t("review"))} <small>${esc(nRev ? this.t("w_due", { n: nRev }) : this.t("w_none"))}</small></button>
        </div>
        <button class="opts-toggle" id="bopts">⚙ ${esc(what)} · ${esc(this.t("n_ex_short", { n: size }))} <span>▾</span></button>
        <div class="opts" id="opts" hidden>
          <p class="muted">${esc(this.t("categories"))}</p>
          <div class="cats">${this.meta.catKeys.map(k => {
            const c = this.meta.cats[k], off = k === "oral" && !this.oralOn();
            return `<button class="cat ${cats.includes(k) ? "on" : ""} ${off ? "disabled" : ""}" style="--c:${c.color}" data-cat="${k}">${c.emoji} ${esc(this.catName(k))}</button>`;
          }).join("")}</div>
          <div class="row wrap">
            <button class="btn ghost" id="bmix">${esc(this.t("mix_all"))}</button>
            <label class="row">${esc(this.t("nb_ex"))}
              <select id="size" class="select">${[5, 10, 15, 20, 30, 50].map(n => `<option ${n === size ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          </div>
          ${!this.speechOK ? `<p class="muted small">🎤 ${esc(this.t("w_no_sr"))}</p>` : ""}
        </div>
        <h2>${esc(this.t("levels_title"))}</h2>
        <div class="levels">${LEVELS.map(lv => {
          const n = this.levelCount(lv, cats), st = d.byLevel[lv];
          return `<button class="level" style="--c:${LEVEL_COLORS[lv]}" data-level="${lv}" ${n ? "" : "disabled"}>
            <b>${lv}</b><span>${esc(this.levelDesc(lv))}</span><small>${esc(this.t("n_ex_short", { n: n.toLocaleString(this.L) }))}${st ? " · " + Math.round(100 * st[1] / st[0]) + " %" : ""}</small>
            ${rec === lv ? `<em>★ ${esc(this.t("level_rec"))}</em>` : ""}</button>`;
        }).join("")}</div>
        <h2>${esc(this.t("w_eval"))}</h2>
        <div class="evals">
          <button class="btn big" style="--c:#0EA5E9" id="bplace">🎯 ${esc(this.t("placement_mode"))}</button>
          <button class="btn big" style="--c:#DC2626" id="bexam">📝 ${esc(this.t("exam_mode"))}</button>
          <button class="btn big" style="--c:#16A34A" id="bwrite">✍️ ${esc(this.t("writing_mode"))}</button>
        </div>
      </div>`);
    $("#bprof").onclick = () => this.showProfiles();
    $("#bmenu").onclick = () => this.showMenu();
    const bi = $("#binstall"); if (bi) bi.onclick = async () => { this.installEvt.prompt(); await this.installEvt.userChoice.catch(() => {}); this.installEvt = null; this.showHome(); };
    const br = $("#bresume"); if (br) br.onclick = () => this.start(lastLv);
    $("#breview").onclick = () => this.start(null, true);
    $("#bopts").onclick = () => { const o = $("#opts"); o.hidden = !o.hidden; };
    $$("[data-cat]", root).forEach(b => b.onclick = () => {
      if (b.classList.contains("disabled")) return this.alert(this.t("w_no_sr"));
      let c = this.selCats();
      c = c.includes(b.dataset.cat) ? c.filter(x => x !== b.dataset.cat) : [...c, b.dataset.cat];
      if (!c.length) c = this.meta.catKeys.slice();
      DB.setting("cats", c); this.showHome(); $("#opts").hidden = false;
    });
    $("#bmix").onclick = () => { DB.setting("cats", this.meta.catKeys.slice()); this.showHome(); $("#opts").hidden = false; };
    $("#size").onchange = e => { DB.setting("size", +e.target.value); this.showHome(); $("#opts").hidden = false; };
    $$("[data-level]", root).forEach(b => b.onclick = () => this.start(b.dataset.level));
    $("#bplace").onclick = () => this.startPlacement();
    $("#bexam").onclick = () => this.startExam();
    $("#bwrite").onclick = () => this.startWriting();
    if (offerPlacement && !d.nAnswers && !rec) {
      setTimeout(async () => { if (this.view === "home" && await this.confirm(this.t("placement_ask"))) this.startPlacement(); }, 300);
    }
  },

  /* ------------------------------------------------------------------ menu */
  showMenu() {
    const c = Cfg.data;
    const m = this.modal(`
      <div class="menu">
        <h3>${esc(this.t("w_menu"))}</h3>
        <button class="mi" data-a="history">📊 ${esc(this.t("a_history"))}</button>
        <button class="mi" data-a="mine">📝 ${esc(this.t("w_mine_n", { n: Custom.list.length }))}</button>
        <button class="mi" data-a="cert">🏅 ${esc(this.t("a_certificate").replace(" (PDF)", "").replace("…", ""))}</button>
        <button class="mi" data-a="profile">👤 ${esc(this.t("a_profile"))}</button>
        <button class="mi" data-a="export">💾 ${esc(this.t("a_export_profile").replace("…", ""))}</button>
        <button class="mi" data-a="import">📂 ${esc(this.t("a_import_profile").replace("…", ""))}</button>
        <h3>${esc(this.t("w_settings"))}</h3>
        <label class="mi sw"><span>🌐 Langue / Language</span><select id="mlang" class="select">${[["fr", "Français"], ["en", "English"]].map(([k, n]) => `<option value="${k}" ${k === this.L ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label class="mi sw"><span>🇫🇷 ${esc(this.t("a_show_tr"))}</span><input type="checkbox" id="mtr" ${c.showTr ? "checked" : ""}></label>
        <label class="mi sw"><span>🔔 ${esc(this.t("a_sound"))}</span><input type="checkbox" id="msnd" ${c.sound ? "checked" : ""}></label>
        <label class="mi sw ${this.speechOK ? "" : "disabled"}"><span>🎤 ${esc(this.t("w_oral"))}</span><input type="checkbox" id="moral" ${this.oralOn() ? "checked" : ""} ${this.speechOK ? "" : "disabled"}></label>
        <label class="mi sw"><span>🔊 ${esc(this.t("m_voice"))}</span><select id="macc" class="select">
          <option value="en-US" ${c.accent === "en-US" ? "selected" : ""}>🇺🇸 ${esc(this.t("a_voice_us"))}</option>
          <option value="en-GB" ${c.accent === "en-GB" ? "selected" : ""}>🇬🇧 ${esc(this.t("a_voice_uk"))}</option></select></label>
        <label class="mi sw"><span>🐢 ${esc(this.t("w_speed"))}</span><input type="range" id="mrate" min="0.6" max="1.3" step="0.05" value="${c.rate}"></label>
        <button class="mi" data-a="test">${esc(this.t("a_sound_test").replace("…", ""))}</button>
        <button class="mi" data-a="about">ℹ️ ${esc(this.t("a_about"))}</button>
        <div class="row end"><button class="btn primary" data-a="close">${esc(this.t("ed_close"))}</button></div>
      </div>`, { cls: "sheet" });
    const close = () => m.remove();
    m.onclick = e => { if (e.target === m) close(); };
    $$("[data-a]", m).forEach(b => b.onclick = async () => {
      const a = b.dataset.a; close();
      if (a === "history") this.showHistory();
      else if (a === "mine") this.showEditor();
      else if (a === "cert") this.makeCertificate();
      else if (a === "profile") this.showProfiles();
      else if (a === "export") this.exportProfile();
      else if (a === "import") this.importProfile();
      else if (a === "test") this.soundTest();
      else if (a === "about") this.alert(this.t("about_text") + "\n\n" + this.t("w_about_web") + "\n\n" + this.t("exam_note"));
    });
    $("#mlang", m).onchange = e => { this.setLang(e.target.value); close(); this.showHome(); this.showMenu(); };
    $("#mtr", m).onchange = e => { c.showTr = e.target.checked; Cfg.save(); };
    $("#msnd", m).onchange = e => { c.sound = e.target.checked; Cfg.save(); };
    $("#moral", m).onchange = e => { c.oral = e.target.checked; Cfg.save(); this.showHome(); this.showMenu(); };
    $("#macc", m).onchange = e => { c.accent = e.target.value; Cfg.save(); this.speak("Hello! This is my voice."); };
    $("#mrate", m).onchange = e => { c.rate = +e.target.value; Cfg.save(); this.speak("Hello! This is my voice."); };
  },
  soundTest() {
    this.sfx("win");
    setTimeout(() => this.speak("Hello! This is a sound test."), 900);
    const v = this.pickVoice();
    this.alert(this.t("st_intro") + "\n\n" + this.t("st_game") + " : " + (Cfg.data.sound ? "✔" : this.t("st_sound_off")) + "\n" +
      this.t("w_voice_used") + " : " + (v ? v.name + " (" + v.lang + ")" : "—") + "\n" +
      this.t("st_english") + " : " + this.voices.length + (this.voices.length ? "" : "\n\n" + this.t("w_voice_none")));
  },

  /* ------------------------------------------------------------------ lancement des series */
  async start(level, review = false) {
    const size = DB.setting("size") || 10;
    const s = await this.withLoading(async () => {
      if (review) {
        const due = DB.dueIds();
        const ids = new Set(due);
        for (const [k, v] of Object.entries(DB.d.last)) if (v === 0) ids.add(k);
        const lvs = [...new Set([...ids].map(id => id.split("-")[0]).filter(p => LEVELS.includes(p)))];
        const pool = await this.pool(lvs);
        pool.push(...Custom.list.filter(e => ids.has(e.id) && !lvs.includes(e.level)));
        return Engine.makeSession(pool, null, DB.d.last, { review: true, size, oral: this.oralOn(), due });
      }
      const pool = await this.pool([level]);
      return Engine.makeSession(pool, level, DB.d.last, { cats: this.selCats(), size, oral: this.oralOn(), due: DB.dueIds() });
    });
    if (!s) return;
    if (!s.exercises.length) return this.alert(this.t(review ? "no_review" : "no_ex"));
    if (!review) DB.setting("lastLevel", level);
    s.rec = DB.startSession(review ? "REV" : level, review ? "review" : "normal");
    s.review = review; s.startLevel = level;
    this.session = s;
    this.showExercise();
  },
  async startPlacement() {
    const s = await this.withLoading(async () => Engine.makePlacement(await this.pool(PLACEMENT_LEVELS)));
    if (!s || !s.exercises.length) return;
    s.rec = DB.startSession("TEST", "placement");
    this.session = s;
    this.showExercise();
  },
  async startExam() {
    const level = await this.pickLevel(this.t("exam_pick"), EXAM_LEVELS, DB.setting("levelRec"));
    if (!level) return;
    await this.loadWriting().catch(() => {});
    const wmin = Engine.WRITING_MINUTES[level] || 30;
    const withW = Writing.tasks.length && await this.confirm(this.t("w_ask_include", { min: wmin }));
    const s = await this.withLoading(async () => Engine.makeExam(await this.pool([level]), level, DB.d.last,
      { oral: this.oralOn(), writingTask: withW ? Writing.pickTask(level) : null }));
    if (!s) return;
    if (!s.exercises.length) return this.alert(this.t("no_ex"));
    const names = [...new Set(s.sec)].map(k => this.t("exam_sec_" + k)).join(" / ");
    let text = this.t("exam_intro", { lv: level, n: s.total, sections: new Set(s.sec).size, min: Math.round(s.limit / 60) });
    if (!this.oralOn()) text = this.t("exam_no_oral") + "\n\n" + text;
    if (!await this.confirm(text + "\n\n" + names)) return;
    s.examLevel = level; s.level = "EXAM";
    s.rec = DB.startSession("EXAM", "exam");
    this.session = s;
    this.deadline = Date.now() + s.limit * 1000;
    clearInterval(this.examTimer);
    this.examTimer = setInterval(() => this.examTick(), 1000);
    this.showExercise();
    this.examTick();
  },
  examTick() {
    const s = this.session;
    if (!s || !s.exam || this.view !== "exercise") { clearInterval(this.examTimer); return; }
    const left = Math.round((this.deadline - Date.now()) / 1000);
    const el = $("#timer");
    if (left <= 0) { if (el) el.textContent = "⏱ 00:00"; clearInterval(this.examTimer); this.finish(true); return; }
    if (el) { el.textContent = "⏱ " + String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"); el.classList.toggle("late", left < 60); }
  },
  async startWriting() {
    const level = await this.pickLevel(this.t("w_pick"), EXAM_LEVELS, DB.setting("levelRec"));
    if (!level) return;
    const ok = await this.withLoading(async () => { await this.loadWriting(); return true; });
    if (!ok) return;
    const done = DB.setting("writingDone") || [];
    const task = Writing.pickTask(level, done);
    if (!task) return this.alert(this.t("no_ex"));
    DB.setting("writingDone", [...done, task.id].slice(-12));
    const s = new Session([Writing.asExercise(task)], level);
    s.rec = DB.startSession(level, "writing"); s.writing = true;
    this.session = s;
    this.showExercise();
  },
  async leaveExercise() {
    const s = this.session;
    if (s && s.exam) {
      if (!await this.confirm(this.t("exam_leave"))) return;
      clearInterval(this.examTimer);
      DB.endSession(s.rec, s.duration, Object.keys(s.log).length, Object.values(s.log).filter(x => x[1]).length);
    } else if (s && s.results.length && s.idx < s.total - 1) {
      if (!await this.confirm(this.t("w_quit_series"))) return;
      DB.endSession(s.rec, s.duration, s.results.length, s.correct);
    }
    this.stopRecognition();
    try { speechSynthesis.cancel(); } catch (_) { /* rien */ }
    this.session = null;
    this.showHome();
  },

  /* ------------------------------------------------------------------ ecran d'exercice */
  showExercise() {
    const s = this.session, ex = s.current(), L = this.L;
    this.answered = false; this.last = null; this.speakRes = null; this.getAnswer = () => "";
    this.stopRecognition();
    const theme = ex.type === "write" ? `${this.t("writing_mode").toUpperCase()} · ${ex.level}`
      : `${this.catEmoji(ex.cat)} ${this.catName(ex.cat).toUpperCase()} · ${this.themeName(ex.theme)} · ${ex.level}`;
    const key = ex.dictation ? "q_dict" : ex.cat === "image" ? "q_image" : "q_" + ex.type;
    const hasAudio = ex.audio !== false && ex.type !== "write";
    const showTr = Cfg.data.showTr && ex.fr && ex.type !== "write";
    const img = ex.image && ex.image.emoji;
    const longQ = ex.question.length > 180 || ex.type === "write";
    const root = this.render("exercise", `
      <div class="ex-top">
        <button class="btn icon ghost" id="bquit" aria-label="quitter">✕</button>
        <div class="bar"><div style="width:${Math.round(100 * s.idx / s.total)}%"></div></div>
        <span class="count">${s.idx + 1}/${s.total}</span>
        ${s.exam ? `<span id="timer" class="timer"></span>` : ""}
      </div>
      <div class="page ex">
        <div class="ex-theme">${esc(theme)}</div>
        <div class="ex-instr">${esc(this.t(key))}</div>
        ${img ? `<div class="ex-img">${esc(img)}</div>` : ""}
        ${ex.type === "order" ? "" : `<div class="ex-q ${longQ ? "long" : ""}">${nl2br(ex.question)}</div>`}
        ${showTr ? `<div class="ex-tr">🇫🇷 ${nl2br(ex.fr)}</div>` : ""}
        ${ex.type === "write" ? `<div class="ex-tr">🇫🇷 ${nl2br(ex.fr)}</div>` : ""}
        ${hasAudio ? `<div class="row wrap listen"><button class="btn small sky" id="blisten">${esc(this.t("listen"))}</button><button class="btn small violet" id="bslow">${esc(this.t("slow"))}</button></div>` : ""}
        <div id="dyn"></div>
        <div id="fb" class="feedback" hidden></div>
      </div>
      <div class="ex-actions">
        <button class="btn primary wide" id="bcheck">${esc(this.t(ex.type === "speak" ? "validate_speak" : "check"))}</button>
        <button class="btn next wide" id="bnext" hidden></button>
      </div>`);
    $("#bquit").onclick = () => this.leaveExercise();
    if (hasAudio) {
      const txt = Engine.questionAudio(ex);
      $("#blisten").onclick = () => this.speak(txt);
      $("#bslow").onclick = () => this.speak(txt, true);
      if (typeof ex.audio === "string") setTimeout(() => this.speak(txt), 350);
    }
    this["build_" + ex.type](ex, $("#dyn"));
    $("#bcheck").onclick = () => this.check();
    $("#bnext").onclick = () => this.nextExercise();
    if (ex.type === "speak") $("#bcheck").hidden = true;
    if (s.exam) { $("#bnext").hidden = false; $("#bnext").textContent = this.t("exam_skip"); this.examTick(); }
    else if (ex.type === "speak") { $("#bnext").hidden = false; $("#bnext").textContent = this.t("w_skip"); $("#bnext").classList.add("ghost"); this.skipMode = true; }
    this.skipMode = !s.exam && ex.type === "speak";
  },

  build_qcm(ex, dyn) {
    const choices = shuffle(ex.choices.slice());
    const one = choices.some(c => c.t.length > 22 || (c.fr || "").length > 28);
    dyn.innerHTML = `<div class="choices ${one ? "one" : ""}">${choices.map((c, i) =>
      `<button class="choice" style="--c:${PALETTE[i % 4]}" data-t="${esc(c.t)}"><b>${esc(c.t)}</b>${c.fr ? `<small hidden>${esc(c.fr)}</small>` : ""}</button>`).join("")}</div>`;
    let sel = "";
    $$(".choice", dyn).forEach(b => b.onclick = () => {
      if (this.answered) return;
      $$(".choice", dyn).forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = b.dataset.t;
      if (this.session.exam) this.check();
    });
    this.getAnswer = () => sel;
  },
  build_fill(ex, dyn) {
    dyn.innerHTML = `<input id="fill" class="input big" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${esc(this.t("type_here"))}">`;
    const inp = $("#fill", dyn);
    inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); this.answered ? this.nextExercise() : this.check(); } };
    if (!ex.dictation && !(typeof ex.audio === "string")) setTimeout(() => inp.focus(), 50);
    this.getAnswer = () => inp.value;
  },
  build_order(ex, dyn) {
    const chosen = [];
    dyn.innerHTML = `<div class="built" id="built"><span class="ph">${esc(this.t("w_sentence_ph"))}</span></div>
      <p class="muted small">${esc(this.t("w_tap_word"))}</p>
      <div class="words">${ex.words.map((w, i) => `<button class="word" style="--c:${PALETTE[i % 4]}" data-i="${i}">${esc(w)}</button>`).join("")}</div>
      <button class="btn ghost small" id="breset">${esc(this.t("reset"))}</button>`;
    const built = $("#built", dyn);
    const draw = () => {
      built.innerHTML = chosen.length ? chosen.map((i, k) => `<button class="wchip" data-k="${k}">${esc(ex.words[i])}</button>`).join(" ")
        : `<span class="ph">${esc(this.t("w_sentence_ph"))}</span>`;
      $$(".word", dyn).forEach(b => { b.disabled = chosen.includes(+b.dataset.i) || this.answered; });
      $$(".wchip", built).forEach(b => b.onclick = () => { if (!this.answered) { chosen.splice(+b.dataset.k, 1); draw(); } });
    };
    $$(".word", dyn).forEach(b => b.onclick = () => { if (!this.answered) { chosen.push(+b.dataset.i); draw(); } });
    $("#breset", dyn).onclick = () => { if (!this.answered) { chosen.length = 0; draw(); } };
    this.getAnswer = () => chosen.map(i => ex.words[i]).join(" ");
  },
  build_write(ex, dyn) {
    const t = ex.task, L = this.L, other = L === "fr" ? "en" : "fr";
    const hint = t.elements.map(el => `${el[L]} (${el[other]})`).join(" ; ");
    dyn.innerHTML = `<p class="muted small">💡 ${esc(hint)}</p>
      <textarea id="wtext" class="input area" autocapitalize="sentences" spellcheck="false" placeholder="${esc(this.t("q_write"))}"></textarea>
      <p class="wcount" id="wcount"></p>`;
    const ta = $("#wtext", dyn), cnt = $("#wcount", dyn);
    const upd = () => {
      const n = Writing.wordsOf(ta.value).length, ok = n >= t.min && n <= t.max * 1.3;
      cnt.textContent = `${this.t("w_words")} : ${n}  (${t.min}–${t.max})${ok ? "  ✔" : ""}`; cnt.classList.toggle("ok", ok);
    };
    ta.oninput = upd; upd();
    this.getAnswer = () => ta.value;
  },
  build_speak(ex, dyn) {
    dyn.innerHTML = `${ex.ipa ? `<div class="ipa">/${esc(ex.ipa)}/</div>` : ""}
      <button class="btn mic" id="bmic">${esc(this.t("mic_start"))}</button>
      <p class="mic-status" id="micstatus">${esc(this.speechOK ? this.t("pron_how") : this.t("w_no_sr"))}</p>
      <div id="speakres"></div>
      <p class="muted small">${esc(this.t("pron_note"))}</p>`;
    $("#bmic", dyn).onclick = () => this.toggleMic();
    this.micState = "idle";
    this.getAnswer = () => this.speakRes ? `${this.speakRes.percent} % — ${this.speakRes.heard}` : "";
  },

  /* ------------------------------------------------------------------ micro (reconnaissance vocale du telephone) */
  toggleMic() {
    if (this.answered) return;
    if (!this.speechOK) return this.alert(this.t("w_no_sr"));
    if (this.micState === "rec") { this.stopRecognition(true); return; }
    try { speechSynthesis.cancel(); } catch (_) { /* rien */ }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = Cfg.data.accent; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
    const ex = this.session.current(), ctx = ex;
    let got = false;
    rec.onresult = e => {
      got = true;
      const alts = [];
      for (const r of e.results) for (let k = 0; k < r.length; k++) alts.push(r[k].transcript);
      const target = Engine.goodAnswer(ex);
      let best = null;
      for (const a of alts) { const sc = Pronun.score(target, a); if (!best || sc.percent > best.percent) best = sc; }
      if (this.session && this.session.current() === ctx) this.onSpeech(best);
    };
    rec.onerror = e => {
      got = true;
      const msg = e.error === "not-allowed" || e.error === "service-not-allowed" ? this.t("w_sr_denied")
        : e.error === "network" || e.error === "language-not-supported" ? this.t("w_sr_network")
          : e.error === "no-speech" ? this.t("mic_too_short") : this.t("speech_fail") + " : " + e.error;
      this.setMic("idle", msg);
    };
    rec.onend = () => { this.recog = null; if (!got) this.setMic("idle", this.t("mic_too_short")); else if (this.micState === "rec") this.setMic("idle"); };
    try { rec.start(); } catch (e) { return this.alert(this.t("mic_fail")); }
    this.recog = rec;
    this.setMic("rec");
  },
  stopRecognition(gracefully = false) {
    if (this.recog) { try { gracefully ? this.recog.stop() : this.recog.abort(); } catch (_) { /* rien */ } if (!gracefully) this.recog = null; }
    if (gracefully) this.setMic("busy");
  },
  setMic(state, msg) {
    this.micState = state;
    const b = $("#bmic"), st = $("#micstatus");
    if (!b) return;
    b.textContent = this.t(state === "rec" ? "mic_stop" : state === "busy" ? "mic_analyzing" : this.speakRes ? "mic_retry" : "mic_start");
    b.classList.toggle("rec", state === "rec");
    b.disabled = state === "busy" || this.answered;
    st.textContent = msg || this.t(state === "rec" ? "mic_listening" : state === "busy" ? "mic_analyzing" : "pron_how");
  },
  onSpeech(r) {
    this.speakRes = r;
    this.setMic("idle");
    const col = Pronun.color(r.percent / 100);
    $("#speakres").innerHTML = `<div class="pron-pct" style="color:${col}">${r.percent} %</div>
      <div class="pron-verdict" style="color:${col}">${esc(this.t("v_" + r.verdict))}</div>
      <p class="pron-words">${r.words.map(([w, sc]) => `<span style="color:${Pronun.color(sc)}">${esc(w)}</span>`).join(" ")}</p>
      <p class="muted"><b>${esc(this.t("heard_label"))}</b> : ${esc(r.heard || this.t("heard_nothing"))}</p>
      <p class="muted small">${esc(this.t("pron_legend"))}</p>`;
    $("#bcheck").hidden = false;
  },

  /* ------------------------------------------------------------------ verification */
  check() {
    if (this.answered || !this.session) return;
    const s = this.session, ex = s.current();
    const raw = this.getAnswer(), ans = raw.trim();
    if (ex.type === "write") {
      if (!ans) return this.alert(this.t("w_empty"));
      const res = Writing.score(ex.task, raw);
      s.wres[s.idx] = res;
      if (s.exam) return this.examRecord(ex, res.pct >= 50, raw);
      s.submit(res.pct >= 50);
      s.log[s.idx] = [raw, res.pct >= 50];
      return this.finishWriting();
    }
    if (!ans) return;
    let ok, pron = null;
    if (ex.type === "speak") {
      if (!this.speakRes) return;
      ok = this.speakRes.percent >= Pronun.PASS; pron = this.speakRes.percent;
      s.pron.push(pron); this.stopRecognition();
    } else ok = Engine.check(ex, ans);
    if (s.exam) {
      if (pron != null) DB.recordPronWords(this.speakRes.words.map(([w, sc]) => [w, sc]));
      return this.examRecord(ex, ok, ans, pron);
    }
    const secs = s.submit(ok);
    s.log[s.idx] = [ans, ok];
    if (!s.placement) DB.record(ex, ok, ans, secs, pron);
    if (pron != null) DB.recordPronWords(this.speakRes.words.map(([w, sc]) => [w, sc]));
    this.sfx(ok ? "correct" : "wrong");
    if (navigator.vibrate && !ok) try { navigator.vibrate(60); } catch (_) { /* rien */ }
    this.answered = true; this.last = [ok, ans];
    const good = Engine.goodAnswer(ex);
    $$(".choice").forEach(b => {
      b.disabled = true;
      if (b.dataset.t === good) b.classList.add("good"); else if (b.dataset.t === ans) b.classList.add("bad");
      const sm = $("small", b); if (sm) sm.hidden = false;
    });
    const f = $("#fill"); if (f) { f.readOnly = true; f.classList.add(ok ? "good" : "bad"); f.blur(); }
    $$(".word").forEach(b => b.disabled = true);
    const rb = $("#breset"); if (rb) rb.disabled = true;
    const mb = $("#bmic"); if (mb) mb.disabled = true;
    if (s.placement) return this.nextExercise();
    $("#bcheck").hidden = true;
    const nb = $("#bnext"); nb.hidden = false; nb.classList.remove("ghost");
    this.skipMode = false;
    nb.textContent = this.t(s.idx >= s.total - 1 ? "finish" : "next");
    this.renderFeedback();
  },
  renderFeedback() {
    const [ok, ans] = this.last, ex = this.session.current(), L = this.L;
    const speak = ex.type === "speak", good = Engine.goodAnswer(ex);
    const gtr = (ex.choices || []).find(c => c.t === good && c.fr), atr = (ex.choices || []).find(c => c.t === ans && c.fr);
    const head = speak ? this.t("v_" + this.speakRes.verdict) : this.t(ok ? "correct" : "wrong");
    const parts = [`<div class="fb-head">${ok ? "✅" : "❌"} ${esc(head)}</div>`];
    if (speak) {
      const r = this.speakRes;
      parts.push(`<p><b>🎤 ${esc(this.t("pron_score"))}</b> : <b class="big">${r.percent} %</b></p><p><b>${esc(this.t("heard_label"))}</b> : ${esc(r.heard || this.t("heard_nothing"))}</p>`);
    } else if (!ok) {
      parts.push(`<p><b>${esc(this.t("your_answer"))}</b> : <b class="red">${esc(ans)}</b>${atr ? ` — <span class="pink">${esc(atr.fr)}</span>` : ""}</p>`);
    }
    parts.push(`<p><b>${esc(this.t(speak ? "target_label" : "good_answer"))}</b> : <b class="green big">${esc(good)}</b>${gtr ? ` — <span class="pink">${esc(gtr.fr)}</span>` : ""}</p>`);
    const x = ex.explain || {};
    const order = L === "fr" ? ["fr", "en"] : ["en", "fr"];
    const lines = order.filter(k => x[k] && x[k] !== "—");
    if (lines.length) parts.push(`<p><b>💡 ${esc(this.t("explanation"))}</b></p>` + lines.map(k => `<p><b class="lang-${k}">${k.toUpperCase()}</b>&nbsp; ${nl2br(x[k])}</p>`).join(""));
    const text = Engine.pronText(ex);
    const words = text.split(/\s+/).map(w => w.replace(/^[ ,.;:!?«»“”"]+|[ ,.;:!?«»“”"]+$/g, "")).filter(Boolean);
    parts.push(`<div class="pron-box"><p><b>🗣 ${esc(this.t("pron"))}</b> : ${esc(text)}</p>${ex.ipa ? `<p class="ipa">/${esc(ex.ipa)}/</p>` : ""}
      <p class="muted small">${esc(this.t("pron_hint").replace("Cliquez sur", "Touchez").replace("Click", "Tap"))}</p>
      <div class="row wrap"><button class="btn small sky" data-say="${esc(text)}">${esc(this.t("listen"))}</button>
      ${words.slice(0, 24).map(w => `<button class="btn small violet" data-slow="${esc(w)}">🐢 ${esc(w)}</button>`).join("")}</div></div>`);
    const fb = $("#fb");
    fb.className = "feedback " + (ok ? "ok" : "ko");
    fb.innerHTML = parts.join("");
    fb.hidden = false;
    $$("[data-say]", fb).forEach(b => b.onclick = () => this.speak(b.dataset.say));
    $$("[data-slow]", fb).forEach(b => b.onclick = () => this.speak(b.dataset.slow, true));
    setTimeout(() => fb.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  },
  examRecord(ex, ok, ans, pron = null) {
    const s = this.session, i = s.idx;
    const secs = s.submit(ok);
    s.log[i] = [ans, !!ok];
    if (ex.type !== "write") DB.record(ex, ok, ans, secs, pron);
    this.answered = true;
    this.nextExercise();
  },
  nextExercise() {
    const s = this.session;
    if (!s) return;
    if (s.exam && !this.answered) { this.stopRecognition(); return this.examRecord(s.current(), false, ""); }
    if (this.skipMode && !this.answered) { this.stopRecognition(); }   // exercice oral passe (micro indisponible)
    try { speechSynthesis.cancel(); } catch (_) { /* rien */ }
    if (s.advance()) this.showExercise(); else this.finish();
  },

  /* ------------------------------------------------------------------ resultats */
  donut(c, n) {
    const p = n ? c / n : 0, r = 54, C = 2 * Math.PI * r;
    return `<svg class="donut" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="${r}" fill="none" stroke="#FECACA" stroke-width="18"/>
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="#22C55E" stroke-width="18" stroke-dasharray="${C * p} ${C}" transform="rotate(-90 70 70)" stroke-linecap="${p > 0 && p < 1 ? "round" : "butt"}"/>
      <text x="70" y="78" text-anchor="middle" font-size="26" font-weight="800" fill="currentColor">${Math.round(100 * p)}%</text></svg>`;
  },
  resultPage(emoji, title, score, body, buttons) {
    const root = this.render("result", `<div class="page narrow result">
      <div class="res-emoji">${emoji}</div><h1>${esc(title)}</h1><div class="res-score">${score}</div>${body}
      <div class="res-btns">${buttons.map(([id, label, cls]) => `<button class="btn ${cls || "primary"} wide" id="${id}">${esc(label)}</button>`).join("")}</div></div>`);
    return root;
  },
  finish(timeout = false) {
    const s = this.session;
    this.stopRecognition();
    if (s.exam) return this.finishExam(timeout);
    if (s.placement) return this.finishPlacement();
    DB.endSession(s.rec, s.duration, s.total, s.correct);
    const pct = Math.round(100 * s.correct / s.total);
    this.sfx(pct >= 50 ? "win" : "lose");
    const list = s.exercises.map((ex, i) => {
      const lg = s.log[i];
      if (!lg) return "";
      return `<li class="${lg[1] ? "ok" : "ko"}">${lg[1] ? "✅" : "❌"} <span>${esc(ex.question.replace(/\s+/g, " ").slice(-80))}</span>
        ${lg[1] ? "" : `<small>${esc(this.t("good_answer"))} : <b>${esc(Engine.goodAnswer(ex))}</b></small>`}</li>`;
    }).join("");
    const pron = s.pron.length ? `<p>🎤 ${esc(this.t("pron_avg"))} : <b>${Math.round(s.pron.reduce((a, b) => a + b, 0) / s.pron.length)} %</b></p>` : "";
    this.resultPage(pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪", this.t("result_title"),
      esc(this.t("score", { c: s.correct, n: s.total, p: pct })),
      this.donut(s.correct, s.total) + pron + `<details class="card"><summary>${esc(this.t("w_series"))}</summary><ul class="series">${list}</ul></details>`,
      [["bagain", this.t("again")], ["bhome", this.t("home"), "ghost"]]);
    $("#bagain").onclick = () => s.review ? this.start(null, true) : this.start(s.startLevel);
    $("#bhome").onclick = () => { this.session = null; this.showHome(); };
  },
  finishPlacement() {
    const s = this.session;
    const [lv, per] = Engine.placementLevel(s.results);
    DB.setting("levelRec", lv);
    DB.endSession(s.rec, s.duration, s.total, s.correct);
    this.sfx("win");
    const rows = PLACEMENT_LEVELS.filter(l => per[l]).map(l => `<tr><td><b style="color:${LEVEL_COLORS[l]}">${l}</b></td><td>${per[l][0]} / ${per[l][1]}</td><td>${per[l][0] >= Math.min(2, per[l][1]) ? "✅" : "❌"}</td></tr>`).join("");
    this.resultPage("🎯", this.t("placement_title"), `<span class="lvbig" style="color:${LEVEL_COLORS[lv]}">${lv}</span><br><small>${esc(this.levelDesc(lv))}</small>`,
      `<h3>${esc(this.t("placement_detail"))}</h3><table class="tbl center">${rows}</table><p class="muted small">${esc(this.t("placement_note"))}</p>`,
      [["bgo", this.t("w_rec_start", { lv })], ["bhome", this.t("home"), "ghost"]]);
    $("#bgo").onclick = () => this.start(lv);
    $("#bhome").onclick = () => { this.session = null; this.showHome(); };
  },
  writingHtml(task, res, withModel = true) {
    const L = this.L;
    const rows = Writing.CRITERIA.map(([k, mx]) => {
      const got = res.pts[k] || 0, col = got >= 0.75 * mx ? "#16A34A" : got >= 0.4 * mx ? "#D97706" : "#DC2626";
      return `<tr><td>${esc(Writing.LABELS[k][L])}</td><td style="color:${col}"><b>${got} / ${mx}</b></td></tr>`;
    }).join("");
    let h = `<p><b>${esc(this.t("w_criteria"))}</b> — ${esc(this.t("w_words"))} : ${res.words}</p><table class="tbl">${rows}</table>`;
    if (res.found.length || res.missing.length)
      h += `<p>✅ <b>${esc(this.t("w_found"))}</b> : ${esc(res.found.map(m => m[L]).join(", ") || "–")}<br>❌ <b>${esc(this.t("w_missing"))}</b> : ${esc(res.missing.map(m => m[L]).join(", ") || "–")}</p>`;
    h += `<p>🔗 <b>${esc(this.t("w_conn"))}</b> : ${esc(res.connectors.join(", ") || "–")}</p>`;
    if (res.unknown.length) h += `<p>🔎 <b>${esc(this.t("w_unknown"))}</b> : ${esc(res.unknown.join(", "))}</p>`;
    h += `<p><b>${esc(this.t("w_self"))}</b><br>${Writing.SELF_CHECK.map(i => "☐ " + esc(i[L])).join("<br>")}</p>`;
    if (withModel) h += `<p><b>📖 ${esc(this.t("w_model"))}</b><br><i>${esc(task.model_en)}</i><br><span class="pink">🇫🇷 ${esc(task.model_fr)}</span></p>`;
    h += `<p class="muted small">⚠ ${esc(this.t("w_limit"))}</p>`;
    return h;
  },
  finishWriting() {
    const s = this.session, ex = s.current(), res = s.wres[s.idx];
    DB.endSession(s.rec, s.duration, 1, res.pct >= 50 ? 1 : 0);
    this.sfx(res.pct >= 50 ? "win" : "lose");
    this.resultPage(res.pct >= 80 ? "🏆" : res.pct >= 50 ? "👍" : "💪", `${this.t("writing_mode")} · ${s.level}`,
      `${esc(this.t("w_score"))} : ${res.total} / 25 <small>(${res.pct} %)</small>`,
      `<div class="card left">${this.writingHtml(ex.task, res)}</div><details class="card left"><summary>${esc(this.t("your_answer"))}</summary><p class="pre">${nl2br(s.log[s.idx][0])}</p></details>`,
      [["bagain", this.t("again")], ["bhome", this.t("home"), "ghost"]]);
    $("#bagain").onclick = () => this.startWriting();
    $("#bhome").onclick = () => { this.session = null; this.showHome(); };
  },
  finishExam(timeout) {
    const s = this.session;
    clearInterval(this.examTimer);
    const cur = s.idx < s.total ? s.current() : null;
    if (cur && cur.type === "write" && !(s.idx in s.log)) {
      const txt = (this.getAnswer() || "").trim(), r0 = Writing.score(cur.task, txt);
      s.wres[s.idx] = r0; s.log[s.idx] = [txt, r0.pct >= 50]; s.results.push([cur.level, r0.pct >= 50]);
    }
    const rep = Engine.examReport(s);
    const okN = Object.values(s.log).filter(x => x[1]).length;
    DB.endSession(s.rec, Math.min(s.duration, s.limit), s.total, okN);
    this.sfx(rep.passed ? "win" : "lose");
    const rows = Object.entries(rep.sections).map(([k, [c, n]]) => {
      const p = rep.pcts[k], col = p < Engine.EXAM_SECTION_MIN ? "#DC2626" : p >= 50 ? "#16A34A" : "#D97706";
      return `<tr><td>${esc(this.t("exam_sec_" + k))}</td><td style="color:${col}"><b>${c} / ${n}</b></td><td style="color:${col}"><b>${Math.round(p / 4)} / 25</b></td></tr>`;
    }).join("");
    let body = `<p class="big"><b>${esc(this.t(rep.passed ? "exam_passed" : "exam_failed"))}</b></p>`;
    if (timeout) body += `<p class="red"><b>${esc(this.t("exam_timeout"))}</b></p>`;
    if (Object.values(rep.pcts).length && Math.min(...Object.values(rep.pcts)) < Engine.EXAM_SECTION_MIN) body += `<p class="red small">${esc(this.t("exam_low_section"))}</p>`;
    body += `<table class="tbl center">${rows}</table>`;
    const wrong = s.exercises.map((ex, i) => [i, ex]).filter(([i, ex]) => ex.type !== "write" && !(s.log[i] && s.log[i][1]));
    if (wrong.length) {
      body += `<details class="card left"><summary>${esc(this.t("exam_review"))} (${wrong.length})</summary><ul class="series">` + wrong.map(([i, ex]) => {
        const a = s.log[i] && s.log[i][0] ? s.log[i][0] : this.t("exam_empty");
        return `<li class="ko">• <span>${esc(ex.question.replace(/\s+/g, " ").slice(-90))}</span><small><span class="red">${esc(this.t("exam_your"))} : ${esc(a)}</span> · <span class="green">${esc(this.t("exam_good"))} : ${esc(Engine.goodAnswer(ex))}</span></small></li>`;
      }).join("") + "</ul></details>";
    }
    s.exercises.forEach((ex, i) => { if (ex.type === "write" && s.wres[i]) body += `<div class="card left"><p><b>✍️ ${esc(this.t("exam_sec_ew"))}</b></p>${this.writingHtml(ex.task, s.wres[i])}</div>`; });
    body += `<p class="muted small">${esc(this.t("exam_note"))}</p>`;
    this.resultPage(rep.passed ? "🏆" : "💪", `${this.t("exam_mode")} · ${s.examLevel}`, `${esc(this.t("exam_total"))} : ${rep.total} / 100`, body,
      [["bhome", this.t("home")]]);
    $("#bhome").onclick = () => { this.session = null; this.showHome(); };
  },

  /* ------------------------------------------------------------------ historique */
  showHistory(tab = "sessions") {
    const d = DB.d, L = this.L;
    const tabs = [["sessions", this.t("tab_sessions")], ["progress", this.t("tab_progress")], ["errors", this.t("tab_errors")],
      ["charts", this.t("tab_charts")], ["pron", this.t("tab_pron")]];
    let body = "";
    const fmtDate = iso => { const x = new Date(iso); return x.toLocaleDateString(L === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "2-digit" }) + " " + x.toLocaleTimeString(L === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" }); };
    const modeName = (m, lv) => m === "review" ? this.t("review_mode") : m === "placement" ? this.t("placement_mode") : m === "exam" ? this.t("exam_mode") : m === "writing" ? this.t("writing_mode") + " " + lv : lv;
    if (tab === "sessions") {
      const ss = d.sessions.slice(-60).reverse();
      body = ss.length ? `<table class="tbl"><tr><th>${esc(this.t("col_date"))}</th><th>${esc(this.t("col_level"))}</th><th>${esc(this.t("col_score"))}</th><th>${esc(this.t("col_duration"))}</th></tr>` +
        ss.map(x => `<tr><td>${esc(fmtDate(x.d))}</td><td>${esc(modeName(x.mode, x.lv))}</td><td><b>${x.c}/${x.n}</b> <small>${Math.round(100 * x.c / x.n)} %</small></td><td>${Math.floor(x.dur / 60)}:${String(x.dur % 60).padStart(2, "0")}</td></tr>`).join("") + "</table>"
        : `<p class="muted">${esc(this.t("chart_none"))}</p>`;
    } else if (tab === "progress") {
      const bar = (label, n, c, color) => `<div class="pbar"><div class="pl"><span>${label}</span><small>${c}/${n} · ${Math.round(100 * c / n)} %</small></div><div class="track"><div style="width:${Math.round(100 * c / n)}%;background:${color}"></div></div></div>`;
      const lv = LEVELS.filter(l => d.byLevel[l]).map(l => bar(`<b style="color:${LEVEL_COLORS[l]}">${l}</b> ${esc(this.levelDesc(l))}`, d.byLevel[l][0], d.byLevel[l][1], LEVEL_COLORS[l])).join("");
      const ct = this.meta.catKeys.filter(k => d.byCat[k]).map(k => bar(`${this.catEmoji(k)} ${esc(this.catName(k))}`, d.byCat[k][0], d.byCat[k][1], this.meta.cats[k].color)).join("");
      const boxes = DB.srsBoxes();
      body = (lv || ct) ? `<h3>${esc(this.t("chart_level"))}</h3>${lv}<h3>${esc(this.t("chart_cat"))}</h3>${ct}
        <h3>🔁 ${esc(this.t("review"))}</h3><p class="muted small">${[0, 1, 2, 3, 4, 5].map(b => `${b === 0 ? "✗" : "📦" + b} : ${boxes[b] || 0}`).join(" · ")}</p>` : `<p class="muted">${esc(this.t("chart_none"))}</p>`;
    } else if (tab === "errors") {
      const e = Object.entries(d.errors).sort((a, b) => b[1][0] - a[1][0]).slice(0, 40);
      body = e.length ? `<table class="tbl"><tr><th>${esc(this.t("col_question"))}</th><th>${esc(this.t("col_cat"))}</th><th>${esc(this.t("col_times"))}</th></tr>` +
        e.map(([id, [n, q, c]]) => `<tr><td>${esc(q)}<br><small class="muted">${esc(id)}</small></td><td>${this.catEmoji(c)}</td><td><b>${n}</b></td></tr>`).join("") + "</table>"
        : `<p class="muted">${esc(this.t("chart_none"))}</p>`;
    } else if (tab === "charts") {
      const ss = d.sessions.filter(x => x.n).slice(-20);
      body = ss.length ? `<h3>${esc(this.t("chart_score"))}</h3>${this.lineChart(ss.map(x => Math.round(100 * x.c / x.n)), "#2563EB")}` +
        `<h3>${esc(this.t("chart_level"))}</h3>${this.barChart(LEVELS.filter(l => d.byLevel[l]).map(l => [l, Math.round(100 * d.byLevel[l][1] / d.byLevel[l][0]), LEVEL_COLORS[l]]))}` +
        `<h3>${esc(this.t("chart_cat"))}</h3>${this.barChart(this.meta.catKeys.filter(k => d.byCat[k]).map(k => [this.catEmoji(k), Math.round(100 * d.byCat[k][1] / d.byCat[k][0]), this.meta.cats[k].color]))}`
        : `<p class="muted">${esc(this.t("chart_none"))}</p>`;
    } else {
      const [avg, n] = DB.pronAverage(), worst = DB.worstWords();
      body = n ? `<p>${esc(this.t("pron_avg"))} : <b>${avg} %</b> (${n})</p><h3>${esc(this.t("chart_pron"))}</h3>${this.lineChart(d.pronHist.slice(-30), "#DC2626")}` +
        (worst.length ? `<h3>${esc(this.t("pron_words_title"))}</h3><table class="tbl"><tr><th>${esc(this.t("col_word"))}</th><th>${esc(this.t("col_tries"))}</th><th>${esc(this.t("col_avg"))}</th><th></th></tr>` +
          worst.map(([w, t, a]) => `<tr><td><b>${esc(w)}</b></td><td>${t}</td><td style="color:${Pronun.color(a / 100)}"><b>${a} %</b></td><td><button class="btn small sky" data-slow="${esc(w)}">🐢</button></td></tr>`).join("") + "</table>" : "")
        : `<p class="muted">${esc(this.t("pron_none"))}</p>`;
    }
    const root = this.render("history", `<header class="topbar"><button class="btn ghost" id="bback">${esc(this.t("w_back"))}</button><div class="brand"><span>${esc(this.t("a_history"))}</span></div></header>
      <div class="page"><div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${k === tab ? "on" : ""}" data-tab="${k}">${esc(n)}</button>`).join("")}</div>
      <div class="card">${body}</div></div>`);
    $("#bback").onclick = () => this.showHome();
    $$("[data-tab]", root).forEach(b => b.onclick = () => { this.view = ""; this.showHistory(b.dataset.tab); });
    $$("[data-slow]", root).forEach(b => b.onclick = () => this.speak(b.dataset.slow, true));
  },
  lineChart(vals, color) {
    if (!vals.length) return "";
    const w = 320, h = 160, p = 24, n = vals.length;
    const x = i => p + (n === 1 ? (w - 2 * p) / 2 : i * (w - 2 * p) / (n - 1)), y = v => h - p - v * (h - 2 * p) / 100;
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}">${[0, 50, 100].map(g => `<line x1="${p}" x2="${w - p}" y1="${y(g)}" y2="${y(g)}" class="grid"/><text x="2" y="${y(g) + 4}" class="axis">${g}</text>`).join("")}
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"/>`).join("")}</svg>`;
  },
  barChart(items) {
    if (!items.length) return "";
    const w = 320, h = 170, p = 22, bw = (w - 2 * p) / items.length;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}">${[0, 50, 100].map(g => `<line x1="${p}" x2="${w - p}" y1="${h - p - g * (h - 2 * p) / 100}" y2="${h - p - g * (h - 2 * p) / 100}" class="grid"/>`).join("")}
      ${items.map(([lab, v, c], i) => { const bh = v * (h - 2 * p) / 100; return `<rect x="${p + i * bw + bw * 0.15}" y="${h - p - bh}" width="${bw * 0.7}" height="${bh}" rx="4" fill="${c}"/><text x="${p + i * bw + bw / 2}" y="${h - p - bh - 4}" text-anchor="middle" class="val">${v}</text><text x="${p + i * bw + bw / 2}" y="${h - 6}" text-anchor="middle" class="axis">${esc(lab)}</text>`; }).join("")}</svg>`;
  },

  /* ------------------------------------------------------------------ mes exercices */
  showEditor(tab = "add") {
    const lvOpts = LEVELS.map(l => `<option>${l}</option>`).join("");
    const catOpts = this.meta.catKeys.filter(k => k !== "oral").map(k => `<option value="${k}">${this.catEmoji(k)} ${esc(this.catName(k))}</option>`).join("");
    let body;
    if (tab === "add") {
      body = `<div class="form">
        <label>${esc(this.t("ed_type"))}<select id="etype" class="select"><option value="qcm">${esc(this.t("ed_t_qcm"))}</option><option value="fill">${esc(this.t("ed_t_fill"))}</option><option value="order">${esc(this.t("ed_t_order"))}</option></select></label>
        <div class="row"><label>${esc(this.t("ed_level"))}<select id="elevel" class="select">${lvOpts}</select></label><label>${esc(this.t("ed_cat"))}<select id="ecat" class="select">${catOpts}</select></label></div>
        <label class="noorder">${esc(this.t("ed_q_en"))}<input id="eq" class="input"><small class="muted">${esc(this.t("ed_q_hint"))}</small></label>
        <label>${esc(this.t("ed_q_fr"))}<input id="efr" class="input"></label>
        <div id="eqcm"><p class="muted small">${esc(this.t("ed_choice"))} — ${esc(this.t("ed_correct"))} ◉</p>${[0, 1, 2, 3].map(i => `<div class="row choice-ed"><input type="radio" name="eok" value="${i}" ${i ? "" : "checked"}><input class="input" id="ec${i}" placeholder="${esc(this.t("ed_choice_en"))} ${i + 1}"><input class="input" id="ef${i}" placeholder="${esc(this.t("ed_choice_fr"))}"></div>`).join("")}</div>
        <label id="efill" hidden>${esc(this.t("ed_answers"))}<input id="ea" class="input" autocapitalize="off"></label>
        <label id="eorder" hidden>${esc(this.t("ed_sentence"))}<input id="es" class="input"></label>
        <label>${esc(this.t("ed_exp_fr"))}<textarea id="exfr" class="input"></textarea></label>
        <label>${esc(this.t("ed_exp_en"))}<textarea id="exen" class="input"></textarea></label>
        <div class="row"><label>${esc(this.t("ed_emoji"))}<input id="eemo" class="input" maxlength="8"></label><label>${esc(this.t("ed_audio"))}<input id="eaud" class="input"></label></div>
        <button class="btn primary wide" id="esave">${esc(this.t("ed_save"))}</button></div>`;
    } else {
      body = Custom.list.length ? `<ul class="mylist">${Custom.list.map(e => `<li><span><b>${e.level}</b> ${this.catEmoji(e.cat)} ${esc({ qcm: "QCM", fill: "✏️", order: "🧩" }[e.type] || e.type)} — ${esc(e.question.replace(/\s+/g, " ").slice(0, 80))}</span><button class="btn icon ghost" data-del="${e.id}">🗑</button></li>`).join("")}</ul>`
        : `<p class="muted">${esc(this.t("ed_empty"))}</p>`;
      body += `<div class="row wrap"><button class="btn ghost" id="eexp">${esc(this.t("ed_export"))}</button><button class="btn ghost" id="eimp">${esc(this.t("ed_import"))}</button></div>`;
    }
    const root = this.render("editor", `<header class="topbar"><button class="btn ghost" id="bback">${esc(this.t("w_back"))}</button><div class="brand"><span>${esc(this.t("m_mine"))}</span></div></header>
      <div class="page narrow"><div class="tabs"><button class="tab ${tab === "add" ? "on" : ""}" data-tab="add">${esc(this.t("ed_tab_add"))}</button><button class="tab ${tab === "list" ? "on" : ""}" data-tab="list">${esc(this.t("w_mine_n", { n: Custom.list.length }))}</button></div>
      <div class="card">${body}</div></div>`);
    $("#bback").onclick = () => this.showHome();
    $$("[data-tab]", root).forEach(b => b.onclick = () => { this.view = ""; this.showEditor(b.dataset.tab); });
    if (tab === "add") {
      const typeSel = $("#etype");
      const upd = () => { const t = typeSel.value; $("#eqcm").hidden = t !== "qcm"; $("#efill").hidden = t !== "fill"; $("#eorder").hidden = t !== "order"; $(".noorder").hidden = t === "order"; };
      typeSel.onchange = upd; upd();
      $("#esave").onclick = () => {
        const t = typeSel.value, q = $("#eq").value.trim(), fr = $("#efr").value.trim();
        const ex = { level: $("#elevel").value, cat: $("#ecat").value, type: t, fr, explain: { fr: $("#exfr").value.trim() || "—", en: $("#exen").value.trim() } };
        if (t !== "order" && !q) return this.alert(this.t("ed_err_q"));
        if (!fr) return this.alert(this.t("ed_err_fr"));
        if (t === "qcm") {
          const okI = +($("input[name=eok]:checked") || { value: 0 }).value, choices = []; let ok = null;
          for (let i = 0; i < 4; i++) {
            const txt = $("#ec" + i).value.trim(), f = $("#ef" + i).value.trim();
            if (txt) { choices.push(f ? { t: txt, fr: f } : { t: txt }); if (i === okI) ok = txt; }
          }
          if (choices.length < 2 || ok == null || new Set(choices.map(c => c.t)).size !== choices.length) return this.alert(this.t("ed_err_choices"));
          Object.assign(ex, { question: q, choices, answer: ok });
        } else if (t === "fill") {
          const a = $("#ea").value.split(";").map(x => x.trim()).filter(Boolean);
          if (!a.length) return this.alert(this.t("ed_err_answer"));
          Object.assign(ex, { question: q, answer: a.length > 1 ? a : a[0] });
        } else {
          const sentence = $("#es").value.trim().split(/\s+/).join(" "), words = sentence.split(" ").filter(Boolean);
          if (words.length < 2) return this.alert(this.t("ed_err_sentence"));
          let sh = words.slice(); for (let k = 0; k < 20; k++) { shuffle(sh); if (sh.join(" ") !== words.join(" ")) break; }
          Object.assign(ex, { question: sh.join(" / "), words: sh, answer: sentence });
        }
        if ($("#eemo").value.trim()) ex.image = { emoji: $("#eemo").value.trim() };
        if ($("#eaud").value.trim()) ex.audio = $("#eaud").value.trim();
        Custom.add(ex);
        this.toast(this.t("ed_saved"));
        this.view = ""; this.showEditor("add");
      };
    } else {
      $$("[data-del]", root).forEach(b => b.onclick = async () => { if (await this.confirm(this.t("ed_confirm_del"))) { Custom.remove(b.dataset.del); this.view = ""; this.showEditor("list"); } });
      $("#eexp").onclick = () => this.download("mes_exercices.json", JSON.stringify(Custom.list, null, 1));
      $("#eimp").onclick = () => this.pickFile(".json,application/json", txt => {
        try { const n = Custom.importList(JSON.parse(txt)); this.alert(n + " " + this.t("ed_imported")); this.view = ""; this.showEditor("list"); }
        catch (_) { this.alert(this.t("ed_bad_file")); }
      });
    }
  },

  /* ------------------------------------------------------------------ fichiers : sauvegarde, restauration */
  download(name, text) {
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  },
  pickFile(accept, cb) {
    const i = document.createElement("input");
    i.type = "file"; i.accept = accept;
    i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsText(f); };
    i.click();
  },
  exportProfile() {
    const data = { format: "eaf-web", version: 1, date: new Date().toISOString(), profile: { name: DB.prof.name, emoji: DB.prof.emoji }, progress: DB.d, custom: Custom.list };
    const safe = DB.prof.name.normalize("NFD").replace(/[^\w]+/g, "_");
    this.download(`profil_${safe}_${today()}.eaf.json`, JSON.stringify(data));
    this.toast(this.t("bk_exported").replace(":", "").trim() + " ✅");
  },
  importProfile() {
    this.pickFile(".json,.eaf,application/json", txt => {
      try {
        const d = JSON.parse(txt);
        if (d.format !== "eaf-web" || !d.profile || !d.progress) throw new Error("format");
        let name = d.profile.name, i = 2;
        while (Profiles.list().some(p => p.name.toLowerCase() === name.toLowerCase())) name = d.profile.name + " (" + i++ + ")";
        const p = Profiles.add(name, EMOJIS.includes(d.profile.emoji) ? d.profile.emoji : "🙂");
        LS.set("eaf.prof." + p.id, d.progress);
        const known = new Set(Custom.list.map(e => JSON.stringify([e.question, e.answer])));
        let added = 0;
        for (const e of d.custom || []) if (Engine.valid(e) && !known.has(JSON.stringify([e.question, e.answer]))) { Custom.add(e); added++; }
        DB.open(p); this.showHome();
        this.alert(`${this.t("w_restored")} ${p.emoji} ${p.name}\n${this.t("ed_imported")} : ${added}`);
      } catch (_) { this.alert(this.t("bk_bad")); }
    });
  },

  /* ------------------------------------------------------------------ attestation */
  async makeCertificate() {
    const elig = LEVELS.filter(l => { const a = DB.d.byLevel[l]; return a && a[0] >= 30 && 100 * a[1] / a[0] >= 80; });
    if (!elig.length) return this.alert(this.t("cert_none"));
    const lv = elig.length === 1 ? elig[0] : await this.pickLevel(this.t("cert_choose"), elig, elig[elig.length - 1]);
    if (!lv) return;
    const [n, c] = DB.d.byLevel[lv], pct = Math.round(100 * c / n), desc = this.meta.levelDesc[lv];
    const date = new Date().toLocaleDateString("fr-FR");
    this.render("cert", `<div class="noprint topbar"><button class="btn ghost" id="bback">${esc(this.t("w_back"))}</button><button class="btn primary" id="bprint">${esc(this.t("w_print"))}</button></div>
      <div class="cert">
        <p class="c1">Attestation de progression</p><p class="c2">Certificate of Progress</p><p class="c3">Exercice d'Anglais pour Français</p>
        <p class="c4">Cette attestation est décernée à<br><i>This certificate is awarded to</i></p>
        <p class="cname">${esc(DB.prof.name)}</p>
        <p class="c4">pour sa réussite en anglais au niveau<br><i>for successfully completing English level</i></p>
        <p class="clv">${lv}</p><p class="c4">${esc(desc.fr)} — <span class="pink">${esc(desc.en)}</span></p>
        <p class="c4">${pct} % de réponses justes sur ${n} exercices<br><span class="pink"><i>${pct}% correct answers out of ${n} exercises</i></span></p>
        <p class="c4">${date}</p>
        <p class="cnote">Document personnel généré par le logiciel, sans valeur officielle (ce n'est ni un diplôme ni un résultat d'examen officiel).<br>Personal document generated by the software, with no official value (it is not a diploma or an official exam result).</p>
      </div>`);
    $("#bback").onclick = () => this.showHome();
    $("#bprint").onclick = () => window.print();
  },
};

window.App = App;
document.addEventListener("DOMContentLoaded", () => App.init());
