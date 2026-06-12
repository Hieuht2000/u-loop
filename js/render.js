"use strict";
/* u-loop · render.js — canvas setup + drawing.
   The scenery, road and start line are painted once into a cached
   offscreen layer; each frame only blits that layer and draws the
   ghost and the player car on top. */

UL.renderer = (() => {
  const cv = document.getElementById("game");
  const cx = cv.getContext("2d");
  let VW = 0, VH = 0, SCALE = 1, OX = 0, OY = 0, DPR = 1;
  let staticLayer = null, staticFor = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    VW = window.innerWidth; VH = window.innerHeight;
    cv.width = VW * DPR; cv.height = VH * DPR;
    const pad = 0.04;
    SCALE = Math.min(VW * (1 - pad) / UL.WORLD_W, VH * (1 - pad) / UL.WORLD_H);
    OX = (VW - UL.WORLD_W * SCALE) / 2;
    OY = (VH - UL.WORLD_H * SCALE) / 2;
    staticFor = null;                       // force static layer rebuild
  }
  window.addEventListener("resize", resize);
  resize();

  const W2S = (x, y) => [OX + x * SCALE, OY + y * SCALE];

  /* ---------- static layer: scenery + road + start line ---------- */
  function buildStatic(track) {
    if (!staticLayer) staticLayer = document.createElement("canvas");
    staticLayer.width = cv.width; staticLayer.height = cv.height;
    const g = staticLayer.getContext("2d");

    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.save();
    g.translate(OX, OY);
    g.scale(SCALE, SCALE);
    // visible world bounds (so the scene fills the letterbox too)
    const vb = {
      x0: -OX / SCALE, y0: -OY / SCALE,
      x1: (VW - OX) / SCALE, y1: (VH - OY) / SCALE
    };
    UL.paintScenery(g, track, vb);
    drawRoad(g, track);
    drawStartLine(g, track);
    g.restore();
    staticFor = track.id;
  }

  function trackPath(g, t) {
    g.beginPath();
    t.samples.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
  }

  function drawRoad(g, t) {
    g.lineJoin = g.lineCap = "round";
    // soft drop shadow
    g.save();
    g.translate(0, 5);
    trackPath(g, t);
    g.lineWidth = t.width;
    g.strokeStyle = "rgba(35,38,43,.15)";
    g.stroke();
    g.restore();
    // casing + surface
    trackPath(g, t);
    g.lineWidth = t.width + 7;
    g.strokeStyle = t.roadCasing;
    g.stroke();
    trackPath(g, t);
    g.lineWidth = t.width;
    g.strokeStyle = t.roadColor;
    g.stroke();
    // center line
    trackPath(g, t);
    g.lineWidth = 2.6;
    g.setLineDash([14, 20]);
    g.strokeStyle = t.centerLine;
    g.stroke();
    g.setLineDash([]);
    // direction chevrons so the racing direction is obvious
    g.fillStyle = "rgba(255,255,255,.7)";
    let acc = 0;
    for (let i = 1; i < t.N; i++) {
      const a = t.samples[i - 1], b = t.samples[i];
      acc += Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc < 170) continue;
      acc = 0;
      if (i < 8 || i > t.N - 8) continue;          // keep the start line clear
      const c = t.samples[(i + 3) % t.N];
      const ang = Math.atan2(c[1] - a[1], c[0] - a[0]);
      g.save();
      g.translate(b[0], b[1]);
      g.rotate(ang);
      g.beginPath();
      g.moveTo(9, 0); g.lineTo(-5, -7); g.lineTo(-1.5, 0); g.lineTo(-5, 7);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  function drawStartLine(g, t) {
    const p0 = t.samples[0], p1 = t.samples[2];
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len, ty = dy / len;
    const nx = -ty, ny = tx;
    const half = t.width / 2 - 6;
    const cols = 8, rows = 2, cw = (half * 2) / cols, ch = 11;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle = (r + c) % 2 === 0 ? "#f5f2ea" : "#23262b";
        const ox = p0[0] + nx * (-half + c * cw) + tx * (r * ch - ch);
        const oy = p0[1] + ny * (-half + c * cw) + ty * (r * ch - ch);
        g.save();
        g.translate(ox, oy);
        g.rotate(Math.atan2(ty, tx));
        g.fillRect(0, 0, ch, cw);
        g.restore();
      }
    }
  }

  /* ---------- per-frame render ---------- */
  function render(S) {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (S.mode === "menu" || !S.track) {
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx.fillStyle = UL.getCSS("--bg");
      cx.fillRect(0, 0, VW, VH);
      cx.fillStyle = UL.getCSS("--bg2");
      circle(VW * 0.18, VH * 0.2, 150);
      circle(VW * 0.85, VH * 0.78, 200);
      circle(VW * 0.8, VH * 0.12, 90);
      return;
    }
    if (staticFor !== S.track.id) buildStatic(S.track);
    cx.drawImage(staticLayer, 0, 0);

    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // exhaust smoke / dust / steam
    for (const p of S.smoke) {
      const [sx, sy] = W2S(p.x, p.y);
      const f = 1 - p.life / p.max;
      cx.fillStyle = p.dust ? "rgba(168,148,108," + (0.34 * f).toFixed(3) + ")"
                   : p.train ? "rgba(246,246,250," + (0.42 * f).toFixed(3) + ")"
                   : "rgba(80,84,92," + (0.30 * f).toFixed(3) + ")";
      cx.beginPath();
      cx.arc(sx, sy, p.r * SCALE, 0, UL.TAU);
      cx.fill();
    }
    // player car
    drawCarAt(S.x, S.y, S.a, S.car, S.offroad ? { alpha: 0.92 } : {});
  }

  function drawCarAt(x, y, a, car, opts) {
    const [sx, sy] = W2S(x, y);
    cx.save();
    cx.translate(sx, sy);
    cx.rotate(a);
    cx.scale(SCALE, SCALE);
    // soft shadow under the body
    cx.fillStyle = "rgba(35,38,43,.25)";
    UL.rr(cx, -car.len / 2 + 1.5, -car.wid / 2 + 2.5, car.len, car.wid, 7);
    cx.fill();
    UL.drawCarSprite(cx, car, opts);
    cx.restore();
  }

  function circle(x, y, r) { cx.beginPath(); cx.arc(x, y, r, 0, UL.TAU); cx.fill(); }

  /* ---------- menu previews ---------- */
  function drawTrackPreview(pc, t) {
    const g = pc.getContext("2d");
    const w = pc.width, h = pc.height;
    const s = Math.min(w * 0.86 / UL.WORLD_W, h * 0.86 / UL.WORLD_H);
    const ox = (w - UL.WORLD_W * s) / 2, oy = (h - UL.WORLD_H * s) / 2;
    g.clearRect(0, 0, w, h);
    g.lineJoin = g.lineCap = "round";
    g.beginPath();
    t.samples.forEach((p, i) => i ? g.lineTo(ox + p[0] * s, oy + p[1] * s) : g.moveTo(ox + p[0] * s, oy + p[1] * s));
    g.closePath();
    g.lineWidth = (t.width + 7) * s; g.strokeStyle = t.roadCasing; g.stroke();
    g.lineWidth = t.width * s; g.strokeStyle = t.roadColor; g.stroke();
    const p0 = t.samples[0];
    g.fillStyle = UL.getCSS("--accent");
    g.beginPath(); g.arc(ox + p0[0] * s, oy + p0[1] * s, 6, 0, UL.TAU); g.fill();
  }

  // GPS-style snapshot of a recorded lap: faint track + the driven line
  function drawLapSnapshot(pc, t, trace) {
    const g = pc.getContext("2d");
    const w = pc.width, h = pc.height;
    g.clearRect(0, 0, w, h);
    const s = Math.min(w * 0.88 / UL.WORLD_W, h * 0.88 / UL.WORLD_H);
    const ox = (w - UL.WORLD_W * s) / 2, oy = (h - UL.WORLD_H * s) / 2;
    g.lineJoin = g.lineCap = "round";
    // the track, faint
    g.beginPath();
    t.samples.forEach((p, i) => i ? g.lineTo(ox + p[0] * s, oy + p[1] * s) : g.moveTo(ox + p[0] * s, oy + p[1] * s));
    g.closePath();
    g.lineWidth = t.width * s;
    g.strokeStyle = "rgba(35,38,43,.13)";
    g.stroke();
    if (!trace || trace.length < 2) return;
    // the driven line, with a white halo like a GPS app
    const tracePath = () => {
      g.beginPath();
      trace.forEach((p, i) => i ? g.lineTo(ox + p[1] * s, oy + p[2] * s) : g.moveTo(ox + p[1] * s, oy + p[2] * s));
    };
    tracePath();
    g.lineWidth = 7; g.strokeStyle = "rgba(255,255,255,.9)"; g.stroke();
    tracePath();
    g.lineWidth = 3.5; g.strokeStyle = UL.getCSS("--accent"); g.stroke();
    // start / finish markers
    const a = trace[0], b = trace[trace.length - 1];
    g.fillStyle = "#2faf63";
    g.beginPath(); g.arc(ox + a[1] * s, oy + a[2] * s, 5, 0, UL.TAU); g.fill();
    g.fillStyle = "#23262b";
    g.beginPath(); g.arc(ox + b[1] * s, oy + b[2] * s, 5, 0, UL.TAU); g.fill();
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(ox + b[1] * s, oy + b[2] * s, 2.2, 0, UL.TAU); g.fill();
  }

  function drawCarPreview(pc, car) {
    const g = pc.getContext("2d");
    g.clearRect(0, 0, pc.width, pc.height);
    g.save();
    g.translate(pc.width / 2, pc.height / 2);
    g.rotate(-Math.PI / 2);                 // nose up
    if (car.kind === "train") {
      // just the locomotive, large, so the SBB mark is readable
      const s = (pc.height * 0.74) / 44;
      g.scale(s, s);
      UL.drawTrainBadge(g, car);
    } else {
      const s = (pc.height * 0.82) / car.len;
      g.scale(s, s);
      UL.drawCarSprite(g, car, {});
    }
    g.restore();
  }

  return { render, drawTrackPreview, drawCarPreview, drawLapSnapshot, resize, W2S, get SCALE() { return SCALE; } };
})();
