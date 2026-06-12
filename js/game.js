"use strict";
/* u-loop · game.js — state, physics, race logic (RACE_LAPS per run), smoke */

UL.game = (() => {
  const RACE_LAPS = 3;        // laps per race — the average of them is the score
  const S = {
    mode: "menu",            // menu | countdown | racing | paused | finished
    track: null, car: UL.CARS[0],
    // car pose
    x: 0, y: 0, a: 0, v: 0, angV: 0,
    lastIdx: 0, offroad: false,
    // race: three laps, the average counts
    lapTime: 0, lastLap: null, bestLap: null, laps: 0,
    lapTimes: [], runRec: [],
    lastRun: null, bestRun: null,
    cp1: false, cp2: false, wrongWayT: 0,
    sessionBest: null, sessionSaved: true,
    // exhaust smoke
    smoke: [], frame: 0,
    countT: 0
  };

  let input = false;          // the one button
  let toastT = 0;

  const el = id => document.getElementById(id);
  const curEl = el("curTime"), lastEl = el("lastTime"), bestEl = el("bestTime"),
        lapEl = el("lapCount"), countEl = el("count"), toastEl = el("toast"),
        wrongEl = el("wrongway"), hintEl = el("hint"), saveBtn = el("saveBestBtn");

  function setInput(on) { input = on; }

  function startRace(trackIdx, car) {
    S.track = UL.TRACKS[trackIdx];
    S.car = car;
    S.bestLap = UL.records.best(S.track.id);
    S.laps = 0; S.lastLap = null;
    S.lastRun = null; S.bestRun = null;
    S.sessionBest = null; S.sessionSaved = true;
    resetCar();
    S.mode = "countdown";
    S.countT = 3.0;
    bestEl.textContent = UL.fmt(S.bestLap);
    lastEl.textContent = "—";
    lapEl.textContent = "0/" + RACE_LAPS;
    hintEl.style.display = "";
    saveBtn.hidden = true;
    UL.beep(420, 0.1, 0.1);
  }

  function resetCar() {
    const t = S.track, p0 = t.samples[0], p1 = t.samples[3];
    S.x = p0[0]; S.y = p0[1];
    S.a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    S.v = 0; S.angV = 0;
    S.lastIdx = 0; S.cp1 = S.cp2 = false;
    S.lapTime = 0;
    S.lapTimes = []; S.runRec = [];
    S.smoke = [];
    S.wrongWayT = 0;
    wrongEl.style.display = "none";
    lapEl.textContent = "0/" + RACE_LAPS;
    curEl.textContent = "0.000";
  }

  // restarts the whole 3-lap run
  function restartLap() {
    resetCar();
    S.mode = "countdown";
    S.countT = 3.0;
  }

  function pause() {
    if (S.mode === "racing" || S.mode === "countdown") S.mode = "paused";
    UL.audio.engineStop();
  }

  function completeLap() {
    const ms = S.lapTime * 1000;
    S.lastLap = ms; S.laps++;
    S.lapTimes.push(ms);
    lastEl.textContent = UL.fmt(ms);
    lapEl.textContent = S.lapTimes.length + "/" + RACE_LAPS;
    S.lapTime = 0;
    S.cp1 = S.cp2 = false;
    if (S.lapTimes.length >= RACE_LAPS) { finishRace(); return; }
    UL.beep(520, 0.09, 0.1);
  }

  function finishRace() {
    const avg = S.lapTimes.reduce((a, b) => a + b, 0) / S.lapTimes.length;
    S.lastRun = {
      ms: avg,
      laps: S.lapTimes.slice(),
      trace: S.runRec.filter((p, i) => i % 4 === 0)
    };
    if (S.sessionBest == null || avg < S.sessionBest) {
      S.sessionBest = avg;
      S.sessionSaved = false;
      S.bestRun = S.lastRun;
      saveBtn.hidden = false;
    }
    if (S.bestLap == null || avg < S.bestLap) {
      S.bestLap = avg;
      bestEl.textContent = UL.fmt(avg);
      UL.records.saveBest(S.track.id, avg);
      toastEl.textContent = UL.i18n.t("toastBest");
      toastEl.classList.add("show");
      toastT = 2.6;
      UL.beep(660, 0.1, 0.14);
      setTimeout(() => UL.beep(880, 0.14, 0.14), 110);
    } else {
      UL.beep(760, 0.2, 0.14, "triangle");
    }
    S.mode = "finished";
    UL.audio.engineStop();
    if (UL.ui && UL.ui.onRaceFinished) UL.ui.onRaceFinished();
  }

  /* ---------------- exhaust smoke ---------------- */
  function spawnSmoke() {
    const car = S.car;
    const back = car.kind === "train" ? -car.len * 0.46 : -car.len * 0.5;
    const px = S.x + Math.cos(S.a) * back, py = S.y + Math.sin(S.a) * back;
    S.smoke.push({
      x: px + (Math.random() - 0.5) * 6,
      y: py + (Math.random() - 0.5) * 6,
      vx: -Math.cos(S.a) * 26 + (Math.random() - 0.5) * 18,
      vy: -Math.sin(S.a) * 26 + (Math.random() - 0.5) * 18,
      r: 2.4 + Math.random() * 2,
      life: 0,
      max: 0.55 + Math.random() * 0.3,
      dust: S.offroad,
      train: car.kind === "train"
    });
    if (S.smoke.length > 90) S.smoke.shift();
  }

  function tickSmoke(dt) {
    for (let i = S.smoke.length - 1; i >= 0; i--) {
      const p = S.smoke[i];
      p.life += dt;
      if (p.life > p.max) { S.smoke.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += 14 * dt;
    }
  }

  /* ---------------- per-frame update ---------------- */
  function update(dt) {
    tickSmoke(dt);                       // puffs keep fading in every mode

    if (S.mode === "countdown") {
      S.countT -= dt;
      const n = Math.ceil(S.countT);
      if (S.countT <= 0) {
        S.mode = "racing";
        countEl.style.display = "none";
        UL.beep(760, 0.18, 0.16, "triangle");
        UL.audio.engineStart(S.car.id);
      } else {
        countEl.style.display = "flex";
        if (countEl.textContent !== String(n)) {
          countEl.textContent = n;
          UL.beep(440, 0.09, 0.12);
        }
      }
      return;
    }
    if (S.mode !== "racing") return;

    const t = S.track, car = S.car;

    // steering: held = left (ccw), released = right (cw)
    const target = input ? -car.turn : car.turn;
    S.angV = UL.lerp(S.angV, target, 1 - Math.exp(-dt * 11));
    S.a += S.angV * dt;

    // speed: per-car top speed; the green is slower
    const top = S.offroad ? car.off : car.speed;
    if (S.v > top) S.v = Math.max(top, S.v - 900 * dt);
    else S.v = Math.min(top, S.v + car.accel * dt);

    S.x += Math.cos(S.a) * S.v * dt;
    S.y += Math.sin(S.a) * S.v * dt;

    // track relation
    const [idx, d] = UL.nearestIdx(t, S.x, S.y, S.lastIdx);
    S.offroad = d > t.width / 2 - 6;

    // progress + checkpoints
    const N = t.N;
    const prevProg = S.lastIdx / N, prog = idx / N;
    S.lastIdx = idx;
    if (Math.abs(prog - 1 / 3) < 0.05) S.cp1 = true;
    if (Math.abs(prog - 2 / 3) < 0.05 && S.cp1) S.cp2 = true;
    if (prevProg > 0.85 && prog < 0.15 && S.cp1 && S.cp2 && S.lapTime > 4) completeLap();
    if (S.mode !== "racing") return;     // race may just have finished

    // wrong-way detector
    let dp = prog - prevProg;
    if (dp > 0.5) dp -= 1;
    if (dp < -0.5) dp += 1;
    S.wrongWayT = (dp < -0.0005 && S.v > 60) ? S.wrongWayT + dt : 0;
    wrongEl.style.display = S.wrongWayT > 0.7 ? "block" : "none";

    // lap clock + path recording (for the GPS snapshot)
    S.lapTime += dt;
    S.runRec.push([0, S.x, S.y]);
    if (S.runRec.length > 24000) S.runRec.shift();

    // exhaust: steady puffing, heavier on the grass or under acceleration
    S.frame++;
    if (S.v > 40 && (S.offroad || S.v < top * 0.85 || S.frame % 3 === 0)) spawnSmoke();

    // engine follows the throttle
    UL.audio.engineSet(S.v / car.speed, S.offroad);

    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.classList.remove("show"); }
    if (S.laps >= 1) hintEl.style.display = "none";
    curEl.textContent = UL.fmt(S.lapTime * 1000);
  }

  return { S, startRace, restartLap, pause, update, setInput };
})();
