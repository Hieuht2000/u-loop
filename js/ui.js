"use strict";
/* u-loop · ui.js — menus, languages, record boards, save dialog,
   results screen, challenge links, and the SBB SwissPass gag */

UL.ui = (() => {
  const S = UL.game.S;
  const el = id => document.getElementById(id);
  const menuEl = el("menu"), hudEl = el("hud"),
        trackBadge = el("trackBadge"), carBadge = el("carBadge"),
        saveOverlay = el("saveOverlay"), saveTime = el("saveTime"),
        saveMeta = el("saveMeta"), saveLaps = el("saveLaps"), nameInput = el("nameInput"),
        resultsOverlay = el("resultsOverlay"), resLaps = el("resLaps"), resAvg = el("resAvg"),
        boardOverlay = el("boardOverlay"), boardTitle = el("boardTitle"),
        boardList = el("boardList"), boardNote = el("boardNote"),
        sbbOverlay = el("sbbOverlay"),
        saveBtn = el("saveBestBtn");

  let selectedCar = UL.carById(UL.records.selectedCar());
  let boardTrackIdx = 0;
  let resumeAfterOverlay = false;
  let returnToResults = false;
  let pendingSave = null;        // { ms, laps, trace } shown in the save dialog

  const T = (k, v) => UL.i18n.t(k, v);

  /* ---------------- languages ---------------- */
  const FLAGS = {
    en: '<svg viewBox="0 0 26 18"><rect width="26" height="18" fill="#1e3f8f"/><path d="M0,0 26,18 M26,0 0,18" stroke="#fff" stroke-width="4"/><path d="M0,0 26,18 M26,0 0,18" stroke="#cf2235" stroke-width="2"/><rect x="10.5" width="5" height="18" fill="#fff"/><rect y="6.5" width="26" height="5" fill="#fff"/><rect x="11.5" width="3" height="18" fill="#cf2235"/><rect y="7.5" width="26" height="3" fill="#cf2235"/></svg>',
    it: '<svg viewBox="0 0 26 18"><rect width="9" height="18" fill="#159352"/><rect x="9" width="8" height="18" fill="#fff"/><rect x="17" width="9" height="18" fill="#cf2235"/></svg>',
    es: '<svg viewBox="0 0 26 18"><rect width="26" height="18" fill="#c8102e"/><rect y="4.5" width="26" height="9" fill="#ffc400"/></svg>',
    el: '<svg viewBox="0 0 26 18"><rect width="26" height="18" fill="#0d5eaf"/><rect y="2" width="26" height="2" fill="#fff"/><rect y="6" width="26" height="2" fill="#fff"/><rect y="10" width="26" height="2" fill="#fff"/><rect y="14" width="26" height="2" fill="#fff"/><rect width="10" height="10" fill="#0d5eaf"/><rect x="4" width="2" height="10" fill="#fff"/><rect y="4" width="10" height="2" fill="#fff"/></svg>',
    fi: '<svg viewBox="0 0 26 18"><rect width="26" height="18" fill="#fff"/><rect x="7" width="4.5" height="18" fill="#003580"/><rect y="6.75" width="26" height="4.5" fill="#003580"/></svg>',
    vi: '<svg viewBox="0 0 26 18"><rect width="26" height="18" fill="#da251d"/><polygon points="13,3.5 14.29,7.22 18.23,7.30 15.09,9.68 16.23,13.45 13,11.2 9.77,13.45 10.91,9.68 7.77,7.30 11.71,7.22" fill="#ffcd00"/></svg>'
  };

  function buildLangRow() {
    const row = el("langRow");
    row.innerHTML = "";
    UL.i18n.codes.forEach(code => {
      const b = document.createElement("button");
      b.className = "flagBtn" + (code === UL.i18n.lang ? " sel" : "");
      b.innerHTML = FLAGS[code] || code;
      b.title = code;
      b.addEventListener("click", () => {
        UL.i18n.set(code);
        applyLang();
        buildMenu();
        UL.beep(560, 0.05, 0.07);
      });
      row.appendChild(b);
    });
    // sound toggle lives next to the flags
    const m = document.createElement("button");
    m.className = "flagBtn muteBtn" + (UL.audio.isMuted() ? " sel" : "");
    m.id = "menuMute";
    m.textContent = UL.audio.isMuted() ? "🔇" : "🔊";
    m.title = "sound";
    m.addEventListener("click", toggleMute);
    row.appendChild(m);
  }

  function toggleMute() {
    UL.audio.setMuted(!UL.audio.isMuted());
    if (!UL.audio.isMuted()) {
      UL.beep(620, 0.07, 0.1);
      if (S.mode === "racing") UL.audio.engineStart(S.car.id);
    }
    const mm = el("menuMute");
    if (mm) {
      mm.textContent = UL.audio.isMuted() ? "🔇" : "🔊";
      mm.classList.toggle("sel", UL.audio.isMuted());
    }
    el("hudMute").textContent = UL.audio.isMuted() ? "🔇" : "🔊";
  }

  function applyLang() {
    el("menuSub").innerHTML = T("sub");
    el("lblVehicle").textContent = T("yourVehicle");
    el("lblTracks").textContent = T("tracks");
    el("menuFoot").innerHTML = T("foot1") + "<br>" + T("foot2");
    el("hint").innerHTML = T("hint");
    el("lblLast").textContent = T("last");
    el("lblBest").textContent = T("best");
    el("lblLap").textContent = T("lap");
    el("backBtn").textContent = T("menu");
    el("saveTitle").textContent = T("saveTitle");
    nameInput.placeholder = T("namePH");
    el("saveConfirm").textContent = T("saveBtn");
    el("saveCancel").textContent = T("skip");
    el("boardClose").textContent = T("close");
    el("boardShare").textContent = T("copyLink");
    el("resTitle").textContent = T("resTitle");
    el("resAvgLbl").textContent = T("average");
    el("resAgain").textContent = T("again");
    el("resMenu").textContent = T("menu");
    el("wrongway").textContent = T("wrongWay");
    el("saveBestBtn").textContent = T("saveBtn") + " ★";
    el("sbbTitle").textContent = T("sbbTitle");
    el("sbbSub").textContent = T("sbbSub");
    el("sbbOk").textContent = T("sbbOk");
    buildLangRow();
  }

  /* ---------------- menu ---------------- */
  function buildMenu() {
    // vehicles
    const carList = el("carList");
    carList.innerHTML = "";
    UL.CARS.forEach(car => {
      const c = document.createElement("button");
      c.className = "ccard" + (car.id === selectedCar.id ? " sel" : "");
      const pc = document.createElement("canvas");
      pc.width = 60 * 2; pc.height = 78 * 2;
      pc.style.width = "60px"; pc.style.height = "78px";
      UL.renderer.drawCarPreview(pc, car);
      c.appendChild(pc);
      c.insertAdjacentHTML("beforeend",
        `<div class="cname">${UL.carNameHTML(car)}</div>
         <div class="stats">
           ${statRow("speed", car.stats.speed)}
           ${statRow("accel", car.stats.accel)}
           ${statRow("grip", car.stats.grip)}
         </div>`);
      c.addEventListener("click", () => {
        const wasTrain = selectedCar.kind === "train";
        selectedCar = car;
        UL.records.selectedCar(car.id);
        carList.querySelectorAll(".ccard").forEach(x => x.classList.remove("sel"));
        c.classList.add("sel");
        UL.beep(540, 0.05, 0.07);
        if (car.kind === "train" && !wasTrain) {
          sbbOverlay.classList.add("on");      // Billettkontrolle!
          UL.beep(523, 0.12, 0.1); setTimeout(() => UL.beep(659, 0.12, 0.1), 130);
          setTimeout(() => UL.beep(784, 0.18, 0.1), 260);
        }
      });
      carList.appendChild(c);
    });

    // tracks
    const list = el("trackList");
    list.innerHTML = "";
    UL.TRACKS.forEach((t, i) => {
      const locked = !!t.unlock && !UL.records.playedAny(t.id);
      const card = document.createElement("div");
      card.className = "tcard" + (locked ? " locked" : "");
      const pc = document.createElement("canvas");
      pc.width = 168 * 2; pc.height = 100 * 2;
      pc.style.width = "168px"; pc.style.height = "100px";
      UL.renderer.drawTrackPreview(pc, t);
      const best = UL.records.best(t.id);
      card.appendChild(pc);
      card.insertAdjacentHTML("beforeend",
        `<div class="tname">${t.name}${locked ? ' <span class="lockIcon">🔒</span>' : ""}</div>
         <div class="tmeta">${locked ? T("lockedHint") : t.diff}</div>
         <div class="tbest">${T("best")} <b>${UL.fmt(best)}</b></div>
         <div class="trow">
           <button class="mini go">${T("race")}</button>
           <button class="mini rec">${T("records")}</button>
         </div>`);
      if (!locked) {
        const go = () => startRace(i);
        pc.addEventListener("click", go);
        card.querySelector(".tname").addEventListener("click", go);
        card.querySelector(".mini.go").addEventListener("click", go);
      } else {
        // rattle the padlock instead of starting the race
        const deny = () => {
          card.classList.remove("shake");
          void card.offsetWidth;               // restart the animation
          card.classList.add("shake");
          UL.beep(170, 0.1, 0.1, "square");
          setTimeout(() => UL.beep(140, 0.12, 0.09, "square"), 110);
        };
        pc.addEventListener("click", deny);
        card.querySelector(".tname").addEventListener("click", deny);
        card.querySelector(".mini.go").addEventListener("click", deny);
      }
      card.querySelector(".mini.rec").addEventListener("click", () => openBoard(i));
      list.appendChild(card);
    });
  }

  function statRow(label, n) {
    let dots = "";
    for (let i = 1; i <= 5; i++) dots += `<span class="d${i <= n ? " on" : ""}"></span>`;
    return `<div class="stat"><span>${label}</span><span class="dots">${dots}</span></div>`;
  }

  /* ---------------- race flow ---------------- */
  function startRace(i) {
    menuEl.style.display = "none";
    hudEl.classList.add("on");
    trackBadge.textContent = UL.TRACKS[i].name;
    carBadge.textContent = selectedCar.name;
    UL.game.startRace(i, selectedCar);
  }

  function toMenu() {
    S.mode = "menu";
    UL.audio.engineStop();
    hudEl.classList.remove("on");
    el("count").style.display = "none";
    closeOverlays();
    menuEl.style.display = "flex";
    buildMenu();
  }

  // called by game.js when the third lap is done: auto-pop the save dialog
  function onRaceFinished() {
    openSaveDialog(S.lastRun, true);
  }

  function showResults() {
    if (!S.lastRun) return;
    const multi = S.lastRun.laps.length > 1;
    resLaps.innerHTML = multi
      ? S.lastRun.laps
          .map((ms, i) => `<div class="lapRow"><span>${T("lap")} ${i + 1}</span><b>${UL.fmt(ms)}</b></div>`)
          .join("")
      : "";
    el("resAvgLbl").textContent = multi ? T("average") : T("lap");
    resAvg.textContent = UL.fmt(S.lastRun.ms);
    resultsOverlay.classList.add("on");
  }

  /* ---------------- save-record dialog ---------------- */
  function openSaveDialog(run, toResults) {
    if (!run) return;
    pendingSave = run;
    returnToResults = !!toResults;
    resumeAfterOverlay = (S.mode === "racing" || S.mode === "countdown");
    UL.game.pause();
    saveTime.textContent = UL.fmt(run.ms);
    const multi = run.laps.length > 1;
    saveMeta.textContent = S.track.name + " · " + S.car.name + " · " + (multi ? T("average") : T("lap"));
    saveLaps.innerHTML = multi
      ? run.laps.map((ms, i) => `<span>${T("lap")} ${i + 1} <b>${UL.fmt(ms)}</b></span>`).join(" · ")
      : "";
    nameInput.value = UL.records.playerName();
    const snap = el("lapSnap");
    snap.width = 320 * 2; snap.height = 190 * 2;
    UL.renderer.drawLapSnapshot(snap, S.track, run.trace);
    saveOverlay.classList.add("on");
    setTimeout(() => nameInput.focus(), 60);
  }

  function confirmSave() {
    if (!pendingSave) return;
    const name = nameInput.value.trim() || "anonymous";
    UL.records.playerName(name);
    const entry = {
      n: name, ms: Math.round(pendingSave.ms),
      c: S.car.id, d: new Date().toISOString().slice(0, 10)
    };
    UL.records.addToBoard(S.track.id, entry);
    if (UL.online.enabled) {
      UL.online.submit(S.track.id, entry).then(ok => {
        if (ok) {
          const toastEl = el("toast");
          toastEl.textContent = T("submitted");
          toastEl.classList.add("show");
          setTimeout(() => toastEl.classList.remove("show"), 2200);
        }
      });
    }
    if (S.bestRun && Math.round(pendingSave.ms) === Math.round(S.bestRun.ms)) {
      S.sessionSaved = true;
      saveBtn.hidden = true;
    }
    saveOverlay.classList.remove("on");
    UL.beep(700, 0.1, 0.12);
    afterSaveDialog();
  }

  function cancelSave() {
    saveOverlay.classList.remove("on");
    afterSaveDialog();
  }

  function afterSaveDialog() {
    pendingSave = null;
    if (returnToResults) { returnToResults = false; showResults(); return; }
    if (resumeAfterOverlay) UL.game.restartLap();
  }

  /* ---------------- record board ---------------- */
  function renderBoardList(entries, highlight) {
    boardList.innerHTML = "";
    if (!entries.length) {
      boardList.innerHTML = `<li class="empty">${T("noRecords")}</li>`;
      return;
    }
    const me = UL.records.playerName();
    entries.forEach((e, i) => {
      const li = document.createElement("li");
      const isHL = highlight && e.n === highlight.n && Math.round(e.ms) === Math.round(highlight.ms);
      if (e.f || isHL || (me && e.n === me)) li.classList.add("friend");
      const car = UL.carById(e.c);
      li.innerHTML =
        `<span class="rank">${i + 1}</span>
         <span class="who">${UL.escapeHTML(e.n)}</span>
         <span class="carTag">${UL.carNameHTML(car)}</span>
         <span class="ms">${UL.fmt(e.ms)}</span>`;
      boardList.appendChild(li);
    });
  }

  // every map keeps its own board: locally per track id, and online the
  // records table is filtered by the same track id
  function openBoard(trackIdx, highlight) {
    boardTrackIdx = trackIdx;
    const t = UL.TRACKS[trackIdx];
    boardTitle.textContent = t.name + " — " + T("records");
    renderBoardList(UL.records.board(t.id), highlight);
    boardOverlay.classList.add("on");

    if (UL.online.enabled) {
      boardTitle.textContent = "🌍 " + t.name + " — " + T("records");
      boardNote.textContent = T("loadingGlobal");
      UL.online.fetchBoard(t.id).then(rows => {
        if (boardTrackIdx !== trackIdx || !boardOverlay.classList.contains("on")) return;
        if (rows) {
          renderBoardList(rows, highlight);
          boardNote.textContent = T("globalNote");
        } else {
          boardNote.textContent = T("globalFail");
        }
      });
    } else {
      boardNote.textContent = T("boardNote");
    }
  }

  function shareChallenge() {
    const t = UL.TRACKS[boardTrackIdx];
    const best = UL.records.best(t.id);
    if (best == null) {
      boardNote.textContent = T("needRun");
      return;
    }
    let name = UL.records.playerName();
    if (!name) {
      name = (prompt(T("namePH") + ":") || "").trim();
      if (!name) return;
      UL.records.playerName(name);
    }
    const payload = { t: t.id, n: name, ms: Math.round(best), c: UL.carById(UL.records.selectedCar() || "f11").id };
    const url = location.origin + location.pathname + "?c=" + UL.b64e(payload);
    copyText(url).then(ok => {
      boardNote.textContent = ok ? T("copied") : T("copyFail") + url;
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => false);
    }
    return Promise.resolve(false);
  }

  function handleChallengeLink() {
    const m = location.search.match(/[?&]c=([^&]+)/);
    if (!m) return;
    const p = UL.b64d(m[1]);
    history.replaceState(null, "", location.pathname);
    if (!p || !p.t || !p.ms || !p.n) return;
    const t = UL.TRACKS.find(x => x.id === p.t);
    if (!t || typeof p.ms !== "number" || p.ms < 1000) return;
    UL.records.addToBoard(t.id, {
      n: String(p.n).slice(0, 16), ms: Math.round(p.ms),
      c: p.c, d: new Date().toISOString().slice(0, 10), f: 1
    });
    openBoard(UL.TRACKS.indexOf(t), { n: p.n, ms: p.ms });
    boardNote.textContent = T("challengeMsg", { n: p.n, t: t.name, ms: UL.fmt(p.ms) });
  }

  /* ---------------- overlay plumbing ---------------- */
  function closeOverlays() {
    saveOverlay.classList.remove("on");
    boardOverlay.classList.remove("on");
    resultsOverlay.classList.remove("on");
    sbbOverlay.classList.remove("on");
  }

  // overlays that should swallow game keys (results handles its own keys)
  function overlayOpen() {
    return saveOverlay.classList.contains("on") ||
           boardOverlay.classList.contains("on") ||
           sbbOverlay.classList.contains("on");
  }

  function closeBoard() {
    boardOverlay.classList.remove("on");
    if (resumeAfterOverlay && S.mode === "paused") {
      resumeAfterOverlay = false;
      UL.game.restartLap();
    }
  }

  function resultsAgain() {
    resultsOverlay.classList.remove("on");
    UL.game.restartLap();
  }

  /* ---------------- wiring ---------------- */
  el("backBtn").addEventListener("click", toMenu);
  el("hudMute").addEventListener("click", toggleMute);
  saveBtn.addEventListener("click", () => openSaveDialog(S.bestRun, S.mode === "finished"));
  el("saveConfirm").addEventListener("click", confirmSave);
  el("saveCancel").addEventListener("click", cancelSave);
  el("boardClose").addEventListener("click", closeBoard);
  el("boardShare").addEventListener("click", shareChallenge);
  el("resAgain").addEventListener("click", resultsAgain);
  el("resMenu").addEventListener("click", toMenu);
  el("sbbOk").addEventListener("click", () => sbbOverlay.classList.remove("on"));
  nameInput.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") confirmSave();
  });

  applyLang();

  return { buildMenu, toMenu, startRace, onRaceFinished, showResults,
           handleChallengeLink, overlayOpen, applyLang, resultsAgain };
})();
