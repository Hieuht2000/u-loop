"use strict";
/* u-loop · cars.js — car types + top-down sprite drawing
   All cars share the same turn radius (speed / turn ≈ 116 px) so every
   track is drivable with any car; they differ in pace, acceleration
   and how well they cope off the track. */

UL.CARS = [
  {
    id: "f11", name: "MAX-F11N", kind: "sedan",
    color: "#e84a33", dark: "#b93324", glass: "#28323e",
    speed: 330, turn: 2.85, accel: 420, off: 145,
    len: 34, wid: 19,
    stats: { speed: 3, accel: 3, grip: 3 }
  },
  {
    id: "x20", name: "ZED-X20P", kind: "gt",
    color: "#f5b51e", dark: "#c98e0e", glass: "#222b36",
    speed: 365, turn: 3.15, accel: 560, off: 115,
    len: 37, wid: 18,
    stats: { speed: 5, accel: 5, grip: 1 }
  },
  {
    id: "f9", name: "ZED-F9P", kind: "pickup",
    color: "#46586b", dark: "#2f3d4c", glass: "#1f2831",
    speed: 348, turn: 3.0, accel: 460, off: 165,
    len: 40, wid: 20,
    stats: { speed: 4, accel: 4, grip: 4 }
  },
  {
    id: "f10", name: "MAX-F10N", kind: "truck",
    color: "#4f86c6", dark: "#3a66a0", glass: "#26303c",
    speed: 296, turn: 2.56, accel: 300, off: 190,
    len: 44, wid: 21,
    stats: { speed: 2, accel: 2, grip: 5 }
  },
  {
    id: "sa", name: "Something Amazing", fancy: "S(omething) A(mazing)", kind: "vespa",
    color: "#46b8a5", dark: "#2f8a7b", glass: "#28323e",
    speed: 312, turn: 2.69, accel: 580, off: 105,
    len: 23, wid: 11,
    stats: { speed: 3, accel: 5, grip: 1 }
  },
  {
    id: "sbb", name: "SBB", kind: "train",
    color: "#eb0000", dark: "#a80000", glass: "#222b36",
    speed: 352, turn: 3.03, accel: 260, off: 80,
    len: 80, wid: 16,
    stats: { speed: 4, accel: 1, grip: 1 }
  }
];

// old ids may still live in saved records, challenge links and the
// shared leaderboard — map them to the new ones
UL.CAR_ID_ALIASES = {
  generoso: "f11", monch: "x20", jungfrau: "f9", eiger: "f10", santis: "sa"
};
UL.carById = id => {
  const key = UL.CAR_ID_ALIASES[id] || id;
  return UL.CARS.find(c => c.id === key) || UL.CARS[0];
};

/* Draw a car centered on the origin, facing +x, in world units.
   The caller sets up translate/rotate/scale.
   opts: { tint: cssColor, alpha: 0..1 } — used for the ghost. */
UL.drawCarSprite = function (g, car, opts = {}) {
  const L = car.len, W = car.wid;
  const body = opts.tint || car.color;
  const dark = opts.tint ? shade(opts.tint, -0.25) : car.dark;
  const glass = car.glass;
  g.save();
  if (opts.alpha != null) g.globalAlpha = opts.alpha;

  // ---- wheels (dark rounded tyres poking out of the body) ----
  g.fillStyle = "#15171b";
  const tyre = (x, y, s = 1) => { UL.rr(g, x - 4.2 * s, y - 2.6 * s, 8.4 * s, 5.2 * s, 2 * s); g.fill(); };
  if (car.kind === "truck") {
    tyre(L * 0.34, -W / 2); tyre(L * 0.34, W / 2);
    tyre(-L * 0.12, -W / 2); tyre(-L * 0.12, W / 2);
    tyre(-L * 0.34, -W / 2); tyre(-L * 0.34, W / 2);
  } else if (car.kind === "pickup") {
    tyre(L * 0.30, -W / 2, 1.25); tyre(L * 0.30, W / 2, 1.25);
    tyre(-L * 0.30, -W / 2, 1.25); tyre(-L * 0.30, W / 2, 1.25);
  } else if (car.kind === "vespa") {
    tyre(L * 0.40, 0, 0.62); tyre(-L * 0.34, 0, 0.62);
  } else if (car.kind === "train") {
    // bogies peeking out under the carriage joints
    for (const bx of [0.44, 0.20, -0.02, -0.23, -0.46])
      { UL.rr(g, L * bx - 3, -W / 2 - 0.6, 6, W + 1.2, 1.5); g.fill(); }
  } else {
    tyre(L * 0.30, -W / 2); tyre(L * 0.30, W / 2);
    tyre(-L * 0.30, -W / 2); tyre(-L * 0.30, W / 2);
  }

  if (car.kind === "truck") drawTruck(g, car, body, dark, glass);
  else if (car.kind === "gt") drawGT(g, car, body, dark, glass);
  else if (car.kind === "pickup") drawPickup(g, car, body, dark, glass);
  else if (car.kind === "vespa") drawVespa(g, car, body, dark, glass);
  else if (car.kind === "train") drawTrain(g, car, body, dark, glass);
  else drawSedan(g, car, body, dark, glass);

  g.restore();
};

/* ---------- individual silhouettes ---------- */

function drawSedan(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  // body with a side-to-side shading gradient (light hits from the left)
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.18));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  UL.rr(g, -L / 2, -h, L, W, 6.5);
  g.fill();
  g.lineWidth = 1.1; g.strokeStyle = "rgba(0,0,0,.35)"; g.stroke();

  // hood + trunk crease lines
  g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 0.9;
  line(g, L * 0.18, -h + 2, L * 0.18, h - 2);
  line(g, -L * 0.27, -h + 2, -L * 0.27, h - 2);

  // glasshouse: one dark glass shape, then a body-color roof inset
  // (what remains visible of the glass is the windshield band at the
  //  front, the rear window band, and thin side windows)
  g.fillStyle = glass;
  UL.rr(g, -L * 0.26, -h + 2.4, L * 0.46, W - 4.8, 3.5);
  g.fill();
  g.fillStyle = lighten(body, 0.10);
  UL.rr(g, -L * 0.19, -h + 4.0, L * 0.26, W - 8.0, 2.5);
  g.fill();
  // subtle windshield highlight
  g.fillStyle = "rgba(255,255,255,.22)";
  UL.rr(g, L * 0.10, -h + 3.2, L * 0.07, W - 6.4, 2);
  g.fill();

  lights(g, L, W, 2.6);
  mirrors(g, L * 0.12, h);
}

function drawGT(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  // wedge body: narrow nose, wide hips
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.2));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(L * 0.5, -2.6);                       // nose tip (rounded by joins)
  g.lineTo(L * 0.5, 2.6);
  g.lineTo(L * 0.30, h - 1.5);
  g.lineTo(-L * 0.36, h);
  g.lineTo(-L * 0.5, h - 2);
  g.lineTo(-L * 0.5, -h + 2);
  g.lineTo(-L * 0.36, -h);
  g.lineTo(L * 0.30, -h + 1.5);
  g.closePath();
  g.lineJoin = "round";
  g.fill();
  g.lineWidth = 1.1; g.strokeStyle = "rgba(0,0,0,.35)"; g.stroke();

  // cockpit bubble set back, narrower than the hips
  g.fillStyle = glass;
  UL.rr(g, -L * 0.18, -h + 3.2, L * 0.34, W - 6.4, 4);
  g.fill();
  g.fillStyle = lighten(body, 0.12);
  UL.rr(g, -L * 0.12, -h + 5.4, L * 0.16, W - 10.8, 2.5); // roof sliver
  g.fill();
  g.fillStyle = "rgba(255,255,255,.22)";
  UL.rr(g, L * 0.08, -h + 4.2, L * 0.06, W - 8.4, 2);
  g.fill();

  // rear wing
  g.fillStyle = dark;
  UL.rr(g, -L * 0.52, -h - 0.6, 3.4, W + 1.2, 1.6);
  g.fill();
  // nose splitter stripe
  g.fillStyle = "rgba(255,255,255,.65)";
  UL.rr(g, L * 0.34, -1.6, L * 0.13, 3.2, 1.4);
  g.fill();

  lights(g, L, W, 2.2);
  mirrors(g, L * 0.10, h);
}

function drawTruck(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  // cargo box (rear two thirds) — pale container with ribs
  g.fillStyle = "#e7e3da";
  UL.rr(g, -L / 2, -h + 0.5, L * 0.62, W - 1, 2.5);
  g.fill();
  g.lineWidth = 1.1; g.strokeStyle = "rgba(0,0,0,.35)"; g.stroke();
  g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 0.8;
  for (let i = 1; i < 5; i++) {
    const x = -L / 2 + (L * 0.62) * (i / 5);
    line(g, x, -h + 1.6, x, h - 1.6);
  }

  // cab (front) in the body color
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.18));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  UL.rr(g, L * 0.14, -h, L * 0.36, W, 4.5);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.1; g.stroke();

  // windshield + cab roof
  g.fillStyle = glass;
  trap(g, L * 0.27, L * 0.36, h - 2.2, h - 3.4);
  g.fillStyle = lighten(body, 0.1);
  UL.rr(g, L * 0.17, -h + 3, L * 0.10, W - 6, 2);
  g.fill();
  // exhaust stack
  g.fillStyle = "#2a2d33";
  g.fillRect(L * 0.15, -h + 1, 2.2, 2.2);

  lights(g, L, W, 2.8);
  mirrors(g, L * 0.42, h);
}

function drawPickup(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  // single body shell, cab forward of center
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.18));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  UL.rr(g, -L / 2, -h, L, W, 4.5);
  g.fill();
  g.lineWidth = 1.1; g.strokeStyle = "rgba(0,0,0,.4)"; g.stroke();

  // open cargo bed at the rear
  g.fillStyle = shade(body, 0.45);
  UL.rr(g, -L / 2 + 1.6, -h + 2, L * 0.34, W - 4, 2);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 0.8;
  for (let i = 1; i < 4; i++)
    line(g, -L / 2 + 1.6 + (L * 0.34) * (i / 4), -h + 2.6, -L / 2 + 1.6 + (L * 0.34) * (i / 4), h - 2.6);

  // glasshouse + roof over the cab
  g.fillStyle = glass;
  UL.rr(g, -L * 0.10, -h + 2.2, L * 0.34, W - 4.4, 3);
  g.fill();
  g.fillStyle = lighten(body, 0.10);
  UL.rr(g, -L * 0.04, -h + 3.8, L * 0.17, W - 7.6, 2);
  g.fill();
  g.fillStyle = "rgba(255,255,255,.2)";
  UL.rr(g, L * 0.15, -h + 3, L * 0.05, W - 6, 1.6);
  g.fill();

  // bull bar + hood scoop
  g.fillStyle = "#23262b";
  UL.rr(g, L / 2 - 1.2, -h + 1, 2.6, W - 2, 1.2);
  g.fill();
  g.fillStyle = shade(body, 0.3);
  UL.rr(g, L * 0.30, -2.6, L * 0.12, 5.2, 1.5);
  g.fill();

  lights(g, L, W, 2.8);
  mirrors(g, L * 0.22, h);
}

function drawVespa(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  // rear body: teardrop over the back wheel
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.2));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, -h * 0.55);
  g.quadraticCurveTo(-L * 0.55, -h * 0.9, -L * 0.5, 0);
  g.quadraticCurveTo(-L * 0.55, h * 0.9, 0, h * 0.55);
  g.closePath();
  g.fill();
  g.lineWidth = 0.9; g.strokeStyle = "rgba(0,0,0,.35)"; g.stroke();

  // floorboard + front leg shield
  g.fillStyle = body;
  UL.rr(g, -1, -h * 0.36, L * 0.28, h * 0.72, 1.2);
  g.fill();
  g.fillStyle = grad;
  UL.rr(g, L * 0.18, -h * 0.9, L * 0.2, h * 1.8, 2.2);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.stroke();

  // handlebar with grips
  g.strokeStyle = "#23262b"; g.lineWidth = 1.6; g.lineCap = "round";
  line(g, L * 0.34, -h * 1.05, L * 0.34, h * 1.05);
  // headlight on the shield
  g.fillStyle = "#ffe9a8";
  g.beginPath(); g.arc(L * 0.30, 0, 1.5, 0, UL.TAU); g.fill();

  // rider: shoulders + helmet
  g.fillStyle = "#3a3f46";
  UL.rr(g, -L * 0.30, -h * 0.62, L * 0.24, h * 1.24, 2.4);
  g.fill();
  g.fillStyle = "#f0eee8";
  g.beginPath(); g.arc(-L * 0.13, 0, h * 0.46, 0, UL.TAU); g.fill();
  g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 0.8; g.stroke();
  g.fillStyle = "rgba(255,255,255,.65)";
  g.beginPath(); g.arc(-L * 0.10, -h * 0.16, h * 0.15, 0, UL.TAU); g.fill();

  // taillight
  g.fillStyle = "#d8311f";
  g.beginPath(); g.arc(-L * 0.48, 0, 1.1, 0, UL.TAU); g.fill();
}

function drawTrain(g, car, body, dark, glass) {
  const L = car.len, W = car.wid, h = W / 2;
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, lighten(body, 0.16));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);

  // three coaches behind the locomotive
  const coach = (x0, len) => {
    g.fillStyle = grad;
    UL.rr(g, x0, -h, len, W, 3);
    g.fill();
    g.lineWidth = 1; g.strokeStyle = "rgba(0,0,0,.4)"; g.stroke();
    // white window bands along both sides
    g.fillStyle = "rgba(255,255,255,.85)";
    UL.rr(g, x0 + 2, -h + 1.6, len - 4, 1.7, 0.8); g.fill();
    UL.rr(g, x0 + 2, h - 3.3, len - 4, 1.7, 0.8); g.fill();
    // grey roof spine
    g.fillStyle = "rgba(0,0,0,.18)";
    UL.rr(g, x0 + 2, -1, len - 4, 2, 1); g.fill();
  };
  // couplers between the three equal coaches and the loco
  g.fillStyle = "#23262b";
  for (const cxp of [0.118, -0.094, -0.306])
    g.fillRect(L * cxp - 1.4, -2, 2.8, 4);

  const CL = L * 0.196;                  // every coach the same length
  coach(-L * 0.50, CL);
  coach(-L * 0.288, CL);
  coach(-L * 0.076, CL);

  // locomotive with a tapered nose
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(L * 0.5, -1.8);
  g.lineTo(L * 0.5, 1.8);
  g.lineTo(L * 0.44, h - 0.6);
  g.lineTo(L * 0.13, h);
  g.lineTo(L * 0.13, -h);
  g.lineTo(L * 0.44, -h + 0.6);
  g.closePath();
  g.lineJoin = "round";
  g.fill();
  g.lineWidth = 1; g.strokeStyle = "rgba(0,0,0,.4)"; g.stroke();
  // dark windshield band
  g.fillStyle = glass;
  UL.rr(g, L * 0.40, -h + 1.6, 2.6, W - 3.2, 1.2); g.fill();
  // pantograph
  g.strokeStyle = "#23262b"; g.lineWidth = 0.9;
  line(g, L * 0.17, -h + 2, L * 0.21, h - 2);
  line(g, L * 0.21, -h + 2, L * 0.17, h - 2);

  // SBB mark in white on the loco roof: cross + double arrows
  g.fillStyle = "#fff";
  const mx = L * 0.30, bw = 1.6;
  g.fillRect(mx - 5.2, -bw / 2, 10.4, bw);          // horizontal bar
  g.fillRect(mx - bw / 2, -3.2, bw, 6.4);           // cross bar
  g.beginPath();                                     // arrowheads
  g.moveTo(mx + 5.2, -2.6); g.lineTo(mx + 7.6, 0); g.lineTo(mx + 5.2, 2.6); g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(mx - 5.2, -2.6); g.lineTo(mx - 7.6, 0); g.lineTo(mx - 5.2, 2.6); g.closePath(); g.fill();
  // headlights
  g.fillStyle = "#ffe9a8";
  g.fillRect(L * 0.485, -h + 1.2, 1.4, 1.8);
  g.fillRect(L * 0.485, h - 3.0, 1.4, 1.8);
}

/* Render a vehicle name as HTML. If the car has a "fancy" form, its
   (bracketed) parts are shrunk — and the brackets dropped — so the
   leading letters stand out: S(omething) A(mazing) -> Something Amazing
   with a big S and A. */
UL.carNameHTML = function (car) {
  return String(car.fancy || car.name).replace(/\(([^)]*)\)/g,
    '<small style="font-size:.6em;opacity:.78;font-weight:600;letter-spacing:0">$1</small>');
};

/* The menu badge for the train: just the locomotive, drawn large so
   the SBB mark reads clearly. Centered on the origin, facing +x,
   roughly 44 x 20 units. */
UL.drawTrainBadge = function (g, car) {
  const L = 44, W = 20, h = W / 2;
  const body = car.color, dark = car.dark;
  // bogies
  g.fillStyle = "#15171b";
  UL.rr(g, L * 0.18 - 4, -h - 0.8, 8, W + 1.6, 2); g.fill();
  UL.rr(g, -L * 0.32 - 4, -h - 0.8, 8, W + 1.6, 2); g.fill();
  // body
  const grad = g.createLinearGradient(0, -h, 0, h);
  grad.addColorStop(0, "#ff4040");
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(L * 0.5, -2.6);
  g.lineTo(L * 0.5, 2.6);
  g.lineTo(L * 0.42, h - 0.8);
  g.lineTo(-L * 0.5, h);
  g.lineTo(-L * 0.5, -h);
  g.lineTo(L * 0.42, -h + 0.8);
  g.closePath();
  g.lineJoin = "round";
  g.fill();
  g.lineWidth = 1.2; g.strokeStyle = "rgba(0,0,0,.4)"; g.stroke();
  // windshield + tail coupler
  g.fillStyle = car.glass;
  UL.rr(g, L * 0.36, -h + 2, 3.4, W - 4, 1.6); g.fill();
  g.fillStyle = "#23262b";
  g.fillRect(-L * 0.5 - 2.6, -2, 2.6, 4);
  // the SBB mark, big: double arrow + cross. The preview rotates the
  // sprite nose-up, so the mark is pre-rotated to stay horizontal.
  g.save();
  g.translate(-L * 0.05, 0);
  g.rotate(Math.PI / 2);
  g.fillStyle = "#fff";
  const bw = 2.6, half = 8;
  g.fillRect(-half, -bw / 2, half * 2, bw);
  g.fillRect(-bw / 2, -5.4, bw, 10.8);
  g.beginPath();
  g.moveTo(half, -4.4); g.lineTo(half + 4.2, 0); g.lineTo(half, 4.4);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(-half, -4.4); g.lineTo(-half - 4.2, 0); g.lineTo(-half, 4.4);
  g.closePath(); g.fill();
  g.restore();
  // headlights
  g.fillStyle = "#ffe9a8";
  g.fillRect(L * 0.475, -h + 1.4, 1.8, 2.2);
  g.fillRect(L * 0.475, h - 3.6, 1.8, 2.2);
};

/* ---------- small shared bits ---------- */

function lights(g, L, W, s) {
  const h = W / 2;
  g.fillStyle = "#ffe9a8";                       // headlights
  UL.rr(g, L / 2 - 2.4, -h + 1.6, 2, s, 1); g.fill();
  UL.rr(g, L / 2 - 2.4, h - 1.6 - s, 2, s, 1); g.fill();
  g.fillStyle = "#d8311f";                       // taillights
  UL.rr(g, -L / 2 + 0.5, -h + 1.6, 1.8, s, 0.8); g.fill();
  UL.rr(g, -L / 2 + 0.5, h - 1.6 - s, 1.8, s, 0.8); g.fill();
}

function mirrors(g, x, h) {
  g.fillStyle = "rgba(0,0,0,.55)";
  g.fillRect(x, -h - 1.6, 2.4, 1.8);
  g.fillRect(x, h - 0.2, 2.4, 1.8);
}

// symmetric slanted glass panel: wide edge at xWide, narrow edge at xNarrow
function trap(g, xWide, xNarrow, halfWide, halfNarrow) {
  g.beginPath();
  g.moveTo(xWide, -halfWide);
  g.lineTo(xWide, halfWide);
  g.lineTo(xNarrow, halfNarrow);
  g.lineTo(xNarrow, -halfNarrow);
  g.closePath();
  g.fill();
}

function line(g, x1, y1, x2, y2) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

// quick hex shade helpers
function lighten(hex, f) { return mix(hex, "#ffffff", f); }
function shade(hex, f)   { return mix(hex, "#000000", -f); }
function mix(a, b, f) {
  const pa = parse(a), pb = parse(b), t = UL.clamp(Math.abs(f), 0, 1);
  const c = pa.map((v, i) => Math.round(UL.lerp(v, pb[i], t)));
  return "rgb(" + c.join(",") + ")";
}
function parse(hex) {
  if (hex[0] !== "#") return [128, 128, 128];
  const n = parseInt(hex.slice(1), 16);
  return hex.length === 7 ? [n >> 16 & 255, n >> 8 & 255, n & 255] : [128, 128, 128];
}
