"use strict";
/* u-loop · tracks.js — track definitions + spline geometry
   World space is 1600 x 1000. Tracks are closed Catmull-Rom splines
   through the control points in `pts`. */

UL.WORLD_W = 1600;
UL.WORLD_H = 1000;

// helper: ellipse ring control points (used by the lake circuit)
function ellipsePts(cx, cy, a, b, rot, n) {
  const out = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    const x = Math.cos(t) * a, y = Math.sin(t) * b;
    out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return out;
}

// helper: build a closed ring around an open spine polyline, with
// per-point left/right offsets (used for the lake circuit — the ring
// hugs both shores of a banana-shaped lake)
UL.offsetLoop = function (spine, offL, offR, cap) {
  const n = spine.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const ol = Array.isArray(offL) ? offL[i] : offL;
    const orr = Array.isArray(offR) ? offR[i] : offR;
    L.push([spine[i][0] + nx * ol, spine[i][1] + ny * ol]);
    R.push([spine[i][0] - nx * orr, spine[i][1] - ny * orr]);
  }
  // rounded 3-point end caps: the shoulders keep the same perpendicular
  // distance as the shore offsets, so the spline sweeps smoothly around
  // the lake tips instead of kinking
  const dirv = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const capArc = (p, tx, ty, offTo, offFrom) => {
    const nx = -ty, ny = tx;
    return [
      [p[0] + tx * cap * 0.55 + nx * offTo * 0.92, p[1] + ty * cap * 0.55 + ny * offTo * 0.92],
      [p[0] + tx * cap, p[1] + ty * cap],
      [p[0] + tx * cap * 0.55 - nx * offFrom * 0.92, p[1] + ty * cap * 0.55 - ny * offFrom * 0.92]
    ];
  };
  const oL = i => Array.isArray(offL) ? offL[i] : offL;
  const oR = i => Array.isArray(offR) ? offR[i] : offR;
  const tE = dirv(spine[n - 2], spine[n - 1]);
  const tS = dirv(spine[1], spine[0]);
  return L
    .concat(capArc(spine[n - 1], tE[0], tE[1], oL(n - 1), oR(n - 1)))
    .concat(R.slice().reverse())
    .concat(capArc(spine[0], tS[0], tS[1], oR(0), oL(0)));
};

// the Zürichsee spine — a gentle banana from the Zürich end down to
// Rapperswil, shared by the track ring and the painted lake
UL.ZSPINE = [
  [370,300],[520,410],[740,505],[980,545],[1190,515],[1295,450]
];
// the shore offsets, shared with the scenery painter
UL.ZOFF = {
  L: [205, 235, 200, 235, 205, 195],
  R: [200, 195, 225, 200, 200, 195],
  cap: 195
};

const OSM_ROAD = {
  roadColor: "#3fe673",
  roadCasing: "#27bd55",
  centerLine: "rgba(255,255,255,.55)"
};

UL.TRACKS = [
  Object.assign({
    id: "thalwil",
    name: "Thalwil Track",
    diff: "stadium · easy",
    width: 130,
    scenery: "thalwil",
    pts: [
      [330,500],[430,730],[640,795],[960,795],[1170,730],
      [1270,500],[1170,270],[960,205],[640,205],[430,270]
    ]
  }, OSM_ROAD),

  Object.assign({
    id: "thalwil-lake",
    name: "Thalwil Lake",
    diff: "around the Zürichsee · curvy",
    width: 118,
    scenery: "thalwilLake",
    // wavy left/right shore offsets make the lap twist like the real coast
    pts: UL.offsetLoop(UL.ZSPINE, UL.ZOFF.L, UL.ZOFF.R, UL.ZOFF.cap)
  }, OSM_ROAD),

  Object.assign({
    id: "tokyo",
    name: "Tokyo Urban",
    diff: "Nishi-Shinjuku grid · easy",
    width: 116,
    scenery: "tokyo",
    // two offset city blocks joined into a Z: eight 90° corners,
    // two of them concave — pure Nishi-Shinjuku grid driving
    pts: (() => {
      const P = [];
      const D = Math.PI / 180;
      const arc = (cx, cy, r, a0, a1, steps) => {
        for (let k = 0; k <= steps; k++) {
          const a = (a0 + (a1 - a0) * k / steps) * D;
          P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
      };
      P.push([560, 292], [760, 290]);      // top of the NW block
      arc(800, 395, 100, -90, 0, 3);       // NW-block NE corner (E -> S)
      arc(984, 456, 84, 180, 90, 3);       // concave corner (S -> E)
      arc(1095, 640, 100, -90, 0, 3);      // SE-block NE corner (E -> S)
      arc(1095, 800, 100, 0, 90, 3);       // SE-block SE corner (S -> W)
      P.push([950, 902]);
      arc(800, 800, 100, 90, 180, 3);      // SE-block SW corner (W -> N)
      arc(616, 694, 84, 0, -90, 3);        // concave corner (N -> W)
      arc(515, 510, 100, 90, 180, 3);      // NW-block SW corner (W -> N)
      arc(515, 395, 100, 180, 270, 3);     // NW-block NW corner (N -> E)
      const cx = 800, cy = 600, rot = -0.045;
      return P.map(p => {
        const dx = p[0] - cx, dy = p[1] - cy;
        return [cx + dx * Math.cos(rot) - dy * Math.sin(rot),
                cy + dx * Math.sin(rot) + dy * Math.cos(rot)];
      });
    })()
  }, OSM_ROAD),

  Object.assign({
    id: "newyork",
    name: "New York",
    diff: "Hudson crossings · hard corners",
    width: 112,
    scenery: "newyork",
    // Manhattan grid block with a stepped jog, crossing the Hudson on
    // two bridges (the river band runs vertically at x 470..645)
    pts: (() => {
      const P = [];
      const D = Math.PI / 180;
      const arc = (cx, cy, r, a0, a1, steps) => {
        for (let k = 0; k <= steps; k++) {
          const a = (a0 + (a1 - a0) * k / steps) * D;
          P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
      };
      P.push([400, 285], [800, 280], [1120, 285]);   // north span + bridge
      arc(1270, 385, 100, -90, 0, 3);                // NE corner (E -> S)
      arc(1285, 470, 85, 0, 90, 3);                  // step corner (S -> W)
      arc(1205, 640, 85, -90, -180, 3);              // step corner (W -> S)
      arc(1020, 720, 100, 0, 90, 3);                 // SE corner (S -> W)
      P.push([800, 825], [430, 820]);                // south span + bridge
      arc(340, 720, 100, 90, 180, 3);                // SW corner (W -> N)
      arc(340, 385, 100, 180, 270, 3);               // NW corner (N -> E)
      return P;
    })()
  }, OSM_ROAD),

  Object.assign({
    id: "interlaken",
    name: "Interlaken",
    diff: "twin lakes ∞ · flowing",
    width: 110,
    scenery: "interlaken",
    // a figure-eight: clockwise around the Brienzersee, crossing at
    // Interlaken, counter-clockwise around the Thunersee
    pts: [
      [1180,300],[1355,345],[1440,490],[1345,630],[1150,690],[975,615],
      [800,498],
      [625,385],[430,295],[235,335],[148,490],[238,645],[430,695],[622,612],
      [803,503],
      [982,388]
    ]
  }, OSM_ROAD),

  Object.assign({
    id: "china",
    name: "China Urban",
    diff: "Shenzhen weave · tricky",
    width: 105,
    scenery: "shenzhen",
    // boustrophedon weave: three sweeps joined by true semicircular
    // U-turns (arc-sampled so the spline doesn't overshoot), plus a
    // return boulevard around the outside
    pts: [
      [420,330],[700,322],[1060,330],
      [1119,346],[1162,389],[1178,448],[1162,506],[1119,549],
      [1060,565],[700,572],[340,565],
      [281,581],[238,624],[223,682],[238,741],[281,784],
      [340,800],[700,808],[1060,800],
      [1245,815],[1355,740],
      [1390,500],[1383,300],
      [1348,168],[1263,133],
      [800,130],[420,132],
      [330,143],[293,180],[280,230],[293,280],[330,317]
    ]
  }, OSM_ROAD),

  Object.assign({
    id: "sauna",
    name: "Finnish Sauna",
    diff: "löyly lap · special",
    width: 115,
    scenery: "sauna",
    unlock: true,        // locked until a race is finished on another map
    // out of the hot room, around the avanto in the frozen lake, and
    // back in through the second door — repeat until properly relaxed
    pts: [
      [740,330],[1000,255],[1230,310],[1320,500],[1230,690],[1000,745],[740,670],
      [560,740],[330,720],[185,560],[205,380],[360,265],[560,262]
    ]
  }, OSM_ROAD)
];

// closed centripetal Catmull-Rom sampling (Barry–Goldman).
// Centripetal parameterization avoids the cusps and overshoots that
// uniform Catmull-Rom produces when control points are unevenly spaced.
UL.sampleSpline = function (pts, per = 26) {
  const n = pts.length, out = [];
  const knot = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
  const mix = (A, B, ta, tb, t) => {
    const f = (t - ta) / (tb - ta);
    return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
  };
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
          p2 = pts[(i + 1) % n],     p3 = pts[(i + 2) % n];
    const t0 = 0,
          t1 = t0 + knot(p0, p1),
          t2 = t1 + knot(p1, p2),
          t3 = t2 + knot(p2, p3);
    for (let j = 0; j < per; j++) {
      const t = t1 + (t2 - t1) * (j / per);
      const A1 = mix(p0, p1, t0, t1, t),
            A2 = mix(p1, p2, t1, t2, t),
            A3 = mix(p2, p3, t2, t3, t);
      const B1 = mix(A1, A2, t0, t2, t),
            B2 = mix(A2, A3, t1, t3, t);
      out.push(mix(B1, B2, t1, t2, t));
    }
  }
  return out;
};

UL.TRACKS.forEach(t => {
  t.samples = UL.sampleSpline(t.pts);
  t.N = t.samples.length;
});

// nearest centerline sample, searching a window around the previous index
UL.nearestIdx = function (t, x, y, from) {
  const N = t.N, win = 26;
  let bi = from, bd = Infinity;
  for (let k = -win; k <= win; k++) {
    const i = (from + k + N) % N;
    const p = t.samples[i];
    const d = UL.dist2(x, y, p[0], p[1]);
    if (d < bd) { bd = d; bi = i; }
  }
  return [bi, Math.sqrt(bd)];
};
