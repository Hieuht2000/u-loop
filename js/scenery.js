"use strict";
/* u-loop · scenery.js — static background scenes, painted once per resize.
   The context arrives already transformed into world coordinates
   (1600 x 1000), and `vb` gives the visible world-space bounds so the
   scene can bleed into the letterbox area.
   The Thalwil scene recreates the OpenStreetMap look of Sportplatz
   Brand in Thalwil: pitch infield, the A3 motorway, side roads,
   forest, small buildings and parking. */

UL.paintScenery = function (g, track, vb) {
  if (track.scenery === "thalwil") paintThalwil(g, vb);
  else if (track.scenery === "thalwilLake") paintThalwilLake(g, vb);
  else if (track.scenery === "tokyo") paintTokyo(g, vb);
  else if (track.scenery === "shenzhen") paintShenzhen(g, vb);
  else if (track.scenery === "newyork") paintNewYork(g, vb);
  else if (track.scenery === "interlaken") paintInterlaken(g, vb);
  else if (track.scenery === "sauna") paintSauna(g, vb);
  else paintMeadow(g, vb);
};

// deterministic little RNG so scenes look identical every load
let _seed = 1;
function srand(s) { _seed = s; }
function rnd() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

/* =========================================================
   THALWIL — OSM map style
   ========================================================= */
function paintThalwil(g, vb) {
  // ---- base: pale OSM land + meadow greens ----
  g.fillStyle = "#f2efe9";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);
  g.fillStyle = "#dcedc8";
  blob(g, 250, 850, 520); blob(g, 900, 980, 560); blob(g, 120, 250, 380);
  g.fillStyle = "#cde6b0";
  blob(g, 480, 950, 300); blob(g, 60, 620, 240);

  // ---- forest, far right beyond the motorway ----
  g.fillStyle = "#add19e";
  g.beginPath();
  g.moveTo(1565, vb.y0 - 50);
  g.lineTo(vb.x1 + 50, vb.y0 - 50);
  g.lineTo(vb.x1 + 50, vb.y1 + 50);
  g.lineTo(1680, vb.y1 + 50);
  g.closePath();
  g.fill();
  for (let i = 0; i < 60; i++) {           // jittered tree glyphs
    const x = 1600 + ((i * 53) % Math.max(60, vb.x1 - 1600));
    const y = vb.y0 + ((i * 137) % Math.max(80, vb.y1 - vb.y0));
    if (x > 1585) treeGlyph(g, x, y, "#5e8a52");
  }

  // ---- side roads (white with grey casing, OSM minor roads) ----
  road(g, [[840,-60],[660,90],[470,170],[330,330],[280,540],[200,760],[140,1060]], 24);
  road(g, [[330,330],[150,300],[-60,310]], 20);                 // junction to the left
  road(g, [[1180,120],[1290,300],[1330,520],[1310,740],[1240,930]], 20); // service road by the motorway

  // dashed footpaths (salmon dashes, like OSM)
  g.strokeStyle = "#e0a39a";
  g.lineWidth = 3.5;
  g.setLineDash([12, 9]);
  path(g, [[280,540],[420,640],[640,900],[900,940],[1240,930]]);
  path(g, [[200,760],[420,860],[640,900]]);
  g.setLineDash([]);

  // ---- stadium apron: beige sport area around the oval ----
  g.fillStyle = "#efe9dc";
  UL.rr(g, 255, 130, 1090, 740, 330);
  g.fill();
  g.strokeStyle = "#ddd3c0"; g.lineWidth = 3; g.stroke();

  // ---- infield: light track verge + teal pitch (Brand 1) ----
  g.fillStyle = "#dff2bf";
  UL.rr(g, 420, 280, 760, 440, 210);
  g.fill();
  g.fillStyle = "#88d8c0";
  g.strokeStyle = "#6cc3aa"; g.lineWidth = 3;
  UL.rr(g, 545, 320, 510, 360, 8);
  g.fill(); g.stroke();
  // football pitch markings
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3.5;
  g.strokeRect(570, 345, 460, 310);
  line(g, 800, 345, 800, 655);
  g.beginPath(); g.arc(800, 500, 52, 0, UL.TAU); g.stroke();
  g.strokeRect(570, 425, 70, 150);          // penalty boxes
  g.strokeRect(960, 425, 70, 150);
  mapLabel(g, "Brand 1", 800, 690, 26);

  // ---- small teal field, top right (Brand 2 across the map) ----
  g.fillStyle = "#88d8c0"; g.strokeStyle = "#6cc3aa"; g.lineWidth = 3;
  g.save();
  g.translate(1320, 60); g.rotate(0.22);
  g.fillRect(-90, -120, 180, 150); g.strokeRect(-90, -120, 180, 150);
  g.restore();

  // ---- grandstand strip between oval and motorway ----
  building(g, 1330, 250, 36, 230, 0.06);
  building(g, 1342, 520, 30, 150, 0.06);
  // parking lot with P
  g.fillStyle = "#eaeaea";
  g.save(); g.translate(1352, 720); g.rotate(0.06);
  UL.rr(g, -28, -55, 56, 110, 6); g.fill();
  g.restore();
  pLabel(g, 1352, 722);
  pLabel(g, 1296, 360);

  // ---- houses along the road, top left (nr. 19 / 20 / 21 in the map) ----
  building(g, 520, 230, 52, 40, -0.12);
  building(g, 452, 320, 44, 38, 0.1);
  building(g, 610, 120, 46, 34, 0.18);
  // garden dots near the top, like the map's little orchard
  for (let i = 0; i < 7; i++) treeGlyph(g, 700 + (i % 4) * 34, 88 + Math.floor(i / 4) * 30, "#7fae6e");

  // ---- building cluster, bottom left ----
  const cluster = [
    [380, 880, 56, 44, 0.15], [470, 930, 48, 40, 0.15], [310, 950, 60, 42, 0.1],
    [200, 900, 46, 56, -0.05], [120, 960, 52, 40, 0.0]
  ];
  cluster.forEach(b => building(g, b[0], b[1], b[2], b[3], b[4]));

  // ---- picnic green with pond, right of the stadium ----
  g.fillStyle = "#b6d59c";
  blob(g, 1140, 660, 80); blob(g, 1205, 610, 55);
  g.fillStyle = "#9ecbf0";
  blob(g, 1118, 632, 17);
  treeGlyph(g, 1170, 690, "#5e8a52");
  treeGlyph(g, 1215, 645, "#5e8a52");
  treeGlyph(g, 1115, 580, "#5e8a52");

  // scattered single trees
  [[300, 700], [240, 420], [640, 70], [1080, 110], [960, 925]].forEach(p =>
    treeGlyph(g, p[0], p[1], "#7fae6e"));

  // ---- the A3 motorway: two red carriageways, diagonal on the right ----
  const a = [1395, vb.y0 - 60], b = [1560, vb.y1 + 60];
  motorwayPair(g, a, b);

  // labels
  mapLabel(g, "Sportplatz Brand", 800, 296, 18);
  mapLabel(g, "Ochsenrainstrasse", 320, 480, 18, -1.12);
}

function motorwayPair(g, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;     // normal
  const gap = 21;                          // half distance between carriageways
  for (const side of [-1, 1]) {
    const p1 = [a[0] + nx * gap * side, a[1] + ny * gap * side];
    const p2 = [b[0] + nx * gap * side, b[1] + ny * gap * side];
    // casing then red fill
    g.strokeStyle = "#c9707f"; g.lineWidth = 34; g.lineCap = "butt";
    line(g, p1[0], p1[1], p2[0], p2[1]);
    g.strokeStyle = "#e8919b"; g.lineWidth = 28;
    line(g, p1[0], p1[1], p2[0], p2[1]);
    // white direction chevrons (opposite ways per carriageway)
    g.fillStyle = "rgba(255,255,255,.9)";
    const steps = Math.floor(len / 130);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = UL.lerp(p1[0], p2[0], t), y = UL.lerp(p1[1], p2[1], t);
      chevron(g, x, y, Math.atan2(dy, dx) + (side < 0 ? Math.PI : 0));
    }
  }
  // A3 shield
  const mx = UL.lerp(a[0], b[0], 0.72), my = UL.lerp(a[1], b[1], 0.72);
  g.save();
  g.translate(mx, my);
  g.fillStyle = "#d23b4e";
  UL.rr(g, -26, -15, 52, 30, 7); g.fill();
  g.fillStyle = "#fff";
  g.font = "bold 20px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("A3", 0, 1);
  g.restore();
}

/* =========================================================
   MEADOW — the quiet default for the other tracks
   ========================================================= */
function paintMeadow(g, vb) {
  g.fillStyle = UL.getCSS("--bg");
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);
  g.fillStyle = UL.getCSS("--bg2");
  blob(g, 290, 200, 170); blob(g, 1360, 780, 220); blob(g, 1280, 120, 100);
  blob(g, 180, 860, 140);
  [[140, 480], [1480, 420], [760, 60], [820, 950], [1500, 90]].forEach(p =>
    treeGlyph(g, p[0], p[1], "#9cb89a"));
}

/* =========================================================
   shared scenery primitives
   ========================================================= */
function blob(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, UL.TAU); g.fill(); }

function line(g, x1, y1, x2, y2) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function path(g, pts) {
  g.beginPath();
  pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.stroke();
}

function road(g, pts, w) {
  g.lineJoin = g.lineCap = "round";
  g.strokeStyle = "#cfc8ba"; g.lineWidth = w + 5; path(g, pts);
  g.strokeStyle = "#ffffff"; g.lineWidth = w; path(g, pts);
}

function building(g, x, y, w, h, rot) {
  g.save();
  g.translate(x, y); g.rotate(rot || 0);
  g.fillStyle = "#d9d0c9";
  g.strokeStyle = "#b3a698"; g.lineWidth = 2;
  UL.rr(g, -w / 2, -h / 2, w, h, 3);
  g.fill(); g.stroke();
  g.restore();
}

function treeGlyph(g, x, y, color) {
  g.fillStyle = color;
  g.beginPath(); g.arc(x, y, 9, 0, UL.TAU); g.fill();
  g.fillStyle = "rgba(0,0,0,.18)";
  g.beginPath(); g.arc(x + 2.5, y + 2.5, 6, 0, UL.TAU); g.fill();
  g.fillStyle = color;
  g.beginPath(); g.arc(x - 1.5, y - 1.5, 6.5, 0, UL.TAU); g.fill();
}

function chevron(g, x, y, ang) {
  g.save();
  g.translate(x, y); g.rotate(ang);
  g.beginPath();
  g.moveTo(7, 0); g.lineTo(-4, -5.5); g.lineTo(-1, 0); g.lineTo(-4, 5.5);
  g.closePath(); g.fill();
  g.restore();
}

function mapLabel(g, text, x, y, size, rot) {
  g.save();
  g.translate(x, y);
  if (rot) g.rotate(rot);
  g.fillStyle = "#6f7d72";
  g.font = "italic " + size + "px Georgia, serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 0, 0);
  g.restore();
}

function pLabel(g, x, y) {
  g.fillStyle = "#3b7dd8";
  g.font = "bold 26px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("P", x, y);
}

/* =========================================================
   THALWIL LAKE — regional OSM map around the Zürichsee
   ========================================================= */
function paintThalwilLake(g, vb) {
  srand(7);
  const W = vb.x1 - vb.x0, H = vb.y1 - vb.y0;
  g.fillStyle = "#f2efe9";
  g.fillRect(vb.x0, vb.y0, W, H);

  // rolling greens + darker woods
  g.fillStyle = "#cdebb0";
  [[200,160,250],[1330,210,290],[380,840,280],[1230,880,260],[820,80,210],[90,560,210],[1530,620,230]]
    .forEach(b => blob(g, b[0], b[1], b[2]));
  g.fillStyle = "#add19e";
  [[210,110,140],[1460,280,160],[280,910,150],[1390,910,140],[1560,120,130]]
    .forEach(b => blob(g, b[0], b[1], b[2]));
  for (let i = 0; i < 26; i++) {
    const spots = [[210,110,120],[1460,280,140],[280,910,130],[1390,910,120]];
    const sp = spots[i % spots.length];
    treeGlyph(g, sp[0] + (rnd() - 0.5) * sp[2] * 1.6, sp[1] + (rnd() - 0.5) * sp[2] * 1.2, "#5e8a52");
  }
  // orange peaks around the edges
  for (let i = 0; i < 24; i++) {
    const edge = i % 4;
    const x = edge === 0 ? 30 + rnd() * 150 : edge === 1 ? 1430 + rnd() * 150 : 200 + rnd() * 1200;
    const y = edge === 2 ? 15 + rnd() * 70 : edge === 3 ? 900 + rnd() * 90 : 80 + rnd() * 840;
    if (x > 150 && x < 1500 && y > 80 && y < 850) continue;
    peak(g, x, y);
  }

  // spine helpers shared with the track ring
  const sp = UL.ZSPINE, n = sp.length;
  const normAt = i => {
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };

  // a country road along the top
  road(g, [[60,210],[340,130],[760,60],[1180,40],[1520,55]], 18);

  // ---- the Zürichsee, hugging the spine like the real banana shape ----
  const lakePts = UL.offsetLoop(sp, 92, 92, 96);
  const lakeSamples = UL.sampleSpline(lakePts, 10);
  g.beginPath();
  lakeSamples.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.closePath();
  g.fillStyle = "#aad3df";
  g.fill();
  g.strokeStyle = "#92c3d4"; g.lineWidth = 3; g.stroke();
  // dashed ferry lines down the middle
  g.strokeStyle = "#7fb6cf"; g.lineWidth = 2; g.setLineDash([10, 12]);
  path(g, sp);
  const n2 = normAt(2);
  path(g, [[sp[1][0], sp[1][1]],
           [sp[2][0] + n2[0] * 60, sp[2][1] + n2[1] * 60],
           [sp[3][0], sp[3][1]]]);
  g.setLineDash([]);
  // Seedamm crossing near the Rapperswil end
  const n4 = normAt(4);
  const s1 = [sp[4][0] + n4[0] * 92, sp[4][1] + n4[1] * 92];
  const s2 = [sp[4][0] - n4[0] * 92, sp[4][1] - n4[1] * 92];
  g.strokeStyle = "#b3a698"; g.lineWidth = 9; line(g, s1[0], s1[1], s2[0], s2[1]);
  g.strokeStyle = "#f5f2ea"; g.lineWidth = 5; line(g, s1[0], s1[1], s2[0], s2[1]);
  // lake label, tilted with the local shore
  g.save();
  g.translate(sp[2][0] + 30, sp[2][1] + 8);
  g.rotate(Math.atan2(sp[3][1] - sp[1][1], sp[3][0] - sp[1][0]));
  g.fillStyle = "#4f7d94"; g.font = "italic 28px Georgia, serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("Zürichsee", 0, 0);
  g.restore();

  // ---- shore towns between the lake and the circuit ----
  // each town sits in the middle of the shore band on its side
  const town = (i, side, name, big, along) => {
    const nn = normAt(i);
    const dx = (along || 0);
    const roadInner = (side > 0 ? UL.ZOFF.L[i] : UL.ZOFF.R[i]) - 62;
    const off = Math.max(114, 92 + (roadInner - 92) * 0.5);
    const p = [sp[i][0] + nn[0] * off * side + dx, sp[i][1] + nn[1] * off * side];
    for (let k = 0; k < (big ? 5 : 3); k++)
      building(g, p[0] + (rnd() - 0.5) * 46, p[1] + (rnd() - 0.5) * 32, 16 + rnd() * 10, 12 + rnd() * 8, rnd() * 0.6);
    mapLabel(g, name, p[0], p[1] + 30, 17);
  };
  // offL side (+1) is the south-west shore
  town(1, 1, "Thalwil", true);
  town(2, 1, "Horgen", false);
  town(3, 1, "Wädenswil", false, -30);
  town(4, 1, "Richterswil", false, -20);
  town(1, -1, "Küsnacht", false, 30);
  town(2, -1, "Meilen", false);
  town(3, -1, "Stäfa", false);
  // Rapperswil at the far tip
  const te = [sp[n-1][0] - sp[n-2][0], sp[n-1][1] - sp[n-2][1]];
  const tl = Math.hypot(te[0], te[1]) || 1;
  const rp = [sp[n-1][0] + te[0] / tl * 118, sp[n-1][1] + te[1] / tl * 118];
  building(g, rp[0], rp[1], 24, 16, 0.2);
  building(g, rp[0] - 8, rp[1] + 20, 16, 13, 0);
  mapLabel(g, "Rapperswil", rp[0] - 28, rp[1] + 42, 16);

  // Zürich, the big grey city beyond the north-west tip
  srand(12);
  for (let i = 0; i < 14; i++)
    building(g, 70 + rnd() * 190, 60 + rnd() * 140, 18 + rnd() * 16, 14 + rnd() * 12, rnd() * 0.8);
  g.fillStyle = "#3d4145";
  g.font = "600 26px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText("Zürich", 165, 240);

  // small side lakes
  g.fillStyle = "#aad3df"; g.strokeStyle = "#92c3d4"; g.lineWidth = 2;
  g.beginPath(); g.ellipse(130, 915, 115, 50, -0.5, 0, UL.TAU); g.fill(); g.stroke();
  mapLabel(g, "Zugersee", 195, 958, 16);
  g.beginPath(); g.ellipse(1470, 105, 78, 35, 0.45, 0, UL.TAU); g.fill(); g.stroke();
  mapLabel(g, "Greifensee", 1470, 155, 15);

  // the A3, red along the south-west shore outside the ring
  g.lineJoin = g.lineCap = "round";
  g.strokeStyle = "#c9707f"; g.lineWidth = 17;
  path(g, [[15,600],[170,740],[420,890],[760,975],[1120,1010]]);
  g.strokeStyle = "#e8919b"; g.lineWidth = 12;
  path(g, [[15,600],[170,740],[420,890],[760,975],[1120,1010]]);
  g.save();
  g.translate(320, 833); g.rotate(0.52);
  g.fillStyle = "#d23b4e"; UL.rr(g, -24, -14, 48, 28, 6); g.fill();
  g.fillStyle = "#fff"; g.font = "bold 18px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A3", 0, 1);
  g.restore();
}

function peak(g, x, y) {
  g.fillStyle = "#d18f4f";
  g.beginPath();
  g.moveTo(x, y - 7); g.lineTo(x + 7, y + 5); g.lineTo(x - 7, y + 5);
  g.closePath(); g.fill();
}

/* =========================================================
   TOKYO URBAN — Nishi-Shinjuku grid, OSM city style
   ========================================================= */
function paintTokyo(g, vb) {
  srand(3);
  g.fillStyle = "#f2efe9";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);

  // outskirts: dense small blocks everywhere outside the circuit
  for (let x = vb.x0 + 40; x < vb.x1; x += 88) {
    for (let y = vb.y0 + 30; y < vb.y1; y += 76) {
      if (x > 290 && x < 1320 && y > 195 && y < 985) continue;   // circuit zone
      if (x > 1360) continue;                                    // rail yard zone
      if (rnd() < 0.22) continue;
      building(g, x + (rnd() - 0.5) * 26, y + (rnd() - 0.5) * 20,
        34 + rnd() * 34, 26 + rnd() * 24, (rnd() - 0.5) * 0.16);
    }
  }

  // yellow avenue grid (drawn under the inner blocks)
  const yroad = (pts, w) => {
    g.lineJoin = g.lineCap = "round";
    g.strokeStyle = "#d4c98f"; g.lineWidth = w + 6; path(g, pts);
    g.strokeStyle = "#f7eebc"; g.lineWidth = w; path(g, pts);
  };
  yroad([[670, vb.y0], [670, vb.y1]], 24);
  yroad([[900, vb.y0], [900, vb.y1]], 24);
  yroad([[1120, vb.y0], [1120, vb.y1]], 24);
  yroad([[vb.x0, 430], [1380, 430]], 24);
  yroad([[vb.x0, 640], [1380, 640]], 24);
  road(g, [[180, vb.y0], [180, vb.y1]], 16);
  road(g, [[vb.x0, 120], [1380, 110]], 16);

  // Shinjuku Central Park fills the NW block's western half
  g.fillStyle = "#c8e6b8";
  UL.rr(g, 478, 362, 168, 192, 16); g.fill();
  g.strokeStyle = "#a9cf97"; g.lineWidth = 3; g.stroke();
  g.fillStyle = "#9ecbf0";
  blob(g, 545, 455, 24);
  srand(9);
  for (let i = 0; i < 7; i++)
    treeGlyph(g, 495 + rnd() * 135, 380 + rnd() * 155, "#6da45c");
  mapLabel(g, "新宿中央公園", 562, 580, 16);
  // a little shrine garden in the SW pocket, outside the loop
  g.fillStyle = "#c8e6b8";
  blob(g, 505, 800, 62);
  treeGlyph(g, 480, 780, "#6da45c");
  treeGlyph(g, 530, 822, "#6da45c");
  building(g, 505, 795, 30, 22, 0.1);

  // skyscraper district inside the loop
  const towers = [
    [745, 415, 110, 90],
    // the SE block's skyscraper cluster
    [890, 680, 105, 90], [1075, 680, 100, 90], [980, 815, 110, 80],
    // the NE pocket, outside the loop
    [1090, 330, 90, 70], [1180, 395, 80, 65]
  ];
  towers.forEach(b => {
    g.fillStyle = "#cbc2b8"; g.strokeStyle = "#a99c8e"; g.lineWidth = 2.5;
    UL.rr(g, b[0] - b[2] / 2, b[1] - b[3] / 2, b[2], b[3], 5);
    g.fill(); g.stroke();
  });
  // Tokyo Metropolitan Government twin towers, NW block east half
  g.fillStyle = "#b6a998"; g.strokeStyle = "#94866f"; g.lineWidth = 2.5;
  UL.rr(g, 690, 462, 130, 88, 4); g.fill(); g.stroke();
  g.fillStyle = "#9d8f7d";
  UL.rr(g, 705, 474, 38, 38, 3); g.fill();
  UL.rr(g, 767, 474, 38, 38, 3); g.fill();
  mapLabel(g, "東京都庁", 755, 578, 16);
  mapLabel(g, "西新宿", 600, 150, 18);
  pLabel(g, 1140, 270);

  // Koshu-Kaido, the salmon arterial skimming the bottom edge
  g.strokeStyle = "#cf8a80"; g.lineWidth = 27;
  path(g, [[vb.x0, 1055], [800, 1010], [1300, 968], [vb.x1, 945]]);
  g.strokeStyle = "#f3b1a6"; g.lineWidth = 21;
  path(g, [[vb.x0, 1055], [800, 1010], [1300, 968], [vb.x1, 945]]);
  g.save();
  g.translate(700, 1018); g.rotate(-0.08);
  g.fillStyle = "#8a4a40"; g.font = "600 17px system-ui, sans-serif";
  g.textAlign = "center"; g.fillText("甲州街道", 0, 0);
  g.restore();

  // rail yard + Shinjuku Station on the right
  for (let i = 0; i < 5; i++) {
    const x = 1420 + i * 26;
    g.strokeStyle = "#6f6f6f"; g.lineWidth = 3.5;
    line(g, x + 18, vb.y0, x - 18, vb.y1);
    g.strokeStyle = "#f5f2ea"; g.lineWidth = 1.6; g.setLineDash([13, 13]);
    line(g, x + 18, vb.y0, x - 18, vb.y1);
    g.setLineDash([]);
  }
  g.fillStyle = "#d4cdc4"; g.strokeStyle = "#a99c8e"; g.lineWidth = 2.5;
  UL.rr(g, 1395, 420, 92, 170, 6); g.fill(); g.stroke();
  g.save();
  g.translate(1441, 505); g.rotate(Math.PI / 2);
  g.fillStyle = "#3d4145"; g.font = "600 20px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("新宿駅", 0, 0);
  g.restore();
  pLabel(g, 350, 165); pLabel(g, 1240, 130);
}

/* =========================================================
   CHINA URBAN — Shenzhen Futian weave, OSM city style
   ========================================================= */
function paintShenzhen(g, vb) {
  srand(21);
  g.fillStyle = "#f2efe9";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);

  // golf club along the right edge
  g.fillStyle = "#b9e2b4";
  g.beginPath();
  g.moveTo(1438, 120); g.lineTo(vb.x1 + 40, 110); g.lineTo(vb.x1 + 40, 900);
  g.lineTo(1500, 905); g.quadraticCurveTo(1430, 700, 1445, 480);
  g.closePath(); g.fill();
  g.setLineDash([3, 7]);
  g.strokeStyle = "#7d9c78"; g.lineWidth = 2; g.stroke();
  g.setLineDash([]);
  g.fillStyle = "#cdedc6";
  blob(g, 1530, 280, 55); blob(g, 1560, 520, 65); blob(g, 1520, 740, 50);
  g.fillStyle = "#9ecbf0";
  blob(g, 1500, 380, 22); blob(g, 1565, 640, 18);
  g.fillStyle = "#f0e7c0";
  blob(g, 1545, 200, 12); blob(g, 1495, 580, 10);
  // little golf flag
  g.strokeStyle = "#4a7d4a"; g.lineWidth = 2.5;
  line(g, 1530, 425, 1530, 450);
  g.fillStyle = "#e84a33";
  g.beginPath(); g.moveTo(1530, 425); g.lineTo(1546, 431); g.lineTo(1530, 437);
  g.closePath(); g.fill();
  g.save();
  g.translate(1505, 480); g.rotate(Math.PI / 2);
  g.fillStyle = "#4a7d4a"; g.font = "600 17px system-ui, sans-serif";
  g.textAlign = "center"; g.fillText("深圳高尔夫俱乐部", 0, 0);
  g.restore();

  // metro line 22, dotted, slicing down past the weave
  g.strokeStyle = "#8a8a8a"; g.lineWidth = 2.4; g.setLineDash([2, 8]);
  path(g, [[960, 130], [995, 420], [1015, 700], [1040, 960]]);
  g.setLineDash([]);

  // pink residential blocks woven between the rows of the circuit
  const band = (yc, label) => {
    for (let x = 380; x <= 1020; x += 112)
      pinkBlock(g, x + (rnd() - 0.5) * 14, yc + (rnd() - 0.5) * 8, 78, 58);
    if (label) {
      g.fillStyle = "#8a5a50"; g.font = "600 17px system-ui, sans-serif";
      g.textAlign = "center"; g.fillText(label, 700, yc + 5);
    }
  };
  band(447, "天安数码城");
  band(682, "泰然社区");
  // big pink estates down the left edge
  pinkBlock(g, 95, 250, 110, 150); pinkBlock(g, 95, 450, 110, 140);
  pinkBlock(g, 95, 640, 110, 130);
  // grey blocks under the bottom row
  srand(5);
  for (let x = 380; x <= 1100; x += 130)
    building(g, x, 905 + (rnd() - 0.5) * 10, 64, 40, (rnd() - 0.5) * 0.1);

  // Shennan Avenue across the top
  bigAvenue(g, vb, 58, "深南大道");
  // Binhe Avenue across the bottom
  bigAvenue(g, vb, 952, "滨河大道");
  // S550 shield
  g.fillStyle = "#f6e27a"; g.strokeStyle = "#c4ab3c"; g.lineWidth = 2;
  UL.rr(g, 1158, 938, 56, 26, 5); g.fill(); g.stroke();
  g.fillStyle = "#5a4d10"; g.font = "bold 16px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("S550", 1186, 952);

  // elevated interchange stack on the left, pink ramps
  const ramp = (pts, w) => {
    g.lineJoin = g.lineCap = "round";
    g.strokeStyle = "#cf7f8c"; g.lineWidth = w + 5; path(g, pts);
    g.strokeStyle = "#e8a0aa"; g.lineWidth = w; path(g, pts);
  };
  ramp([[28, vb.y0], [22, 500], [30, vb.y1]], 13);
  ramp([[28, 180], [120, 95], [300, 76]], 11);
  ramp([[24, 700], [130, 850], [330, 950]], 11);
  g.strokeStyle = "#cf7f8c"; g.lineWidth = 15;
  g.beginPath(); g.arc(95, 790, 48, 0, UL.TAU); g.stroke();
  g.strokeStyle = "#e8a0aa"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#d23b4e";
  UL.rr(g, 6, 580, 44, 26, 5); g.fill();
  g.fillStyle = "#fff"; g.font = "bold 16px system-ui, sans-serif";
  g.fillText("G4", 28, 594);

  // labels
  g.fillStyle = "#6f7d72"; g.font = "600 18px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText("车公庙", 700, 238);
  g.fillText("香蜜湖", 700, 28);
  mapLabel(g, "福田", 200, 880, 16);
}

function pinkBlock(g, x, y, w, h) {
  g.fillStyle = "#f3d7d0"; g.strokeStyle = "#ddb3a8"; g.lineWidth = 2;
  UL.rr(g, x - w / 2, y - h / 2, w, h, 4);
  g.fill(); g.stroke();
}

function bigAvenue(g, vb, y, label) {
  g.lineJoin = g.lineCap = "butt";
  g.strokeStyle = "#e0ad62"; g.lineWidth = 34;
  line(g, vb.x0, y, vb.x1, y);
  g.strokeStyle = "#fcd6a4"; g.lineWidth = 28;
  line(g, vb.x0, y, vb.x1, y);
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2; g.setLineDash([16, 14]);
  line(g, vb.x0, y, vb.x1, y);
  g.setLineDash([]);
  g.fillStyle = "#9a6b2f"; g.font = "600 17px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, 640, y); g.fillText(label, 1320, y);
}

/* =========================================================
   NEW YORK — Midtown Manhattan + the Hudson, OSM city style.
   The circuit crosses the river on two suspension bridges.
   ========================================================= */
const NY_RIVER = { x0: 470, x1: 645 };

function paintNewYork(g, vb) {
  srand(33);
  g.fillStyle = "#f2efe9";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);

  // ---- New Jersey side: Hoboken / Weehawken grid ----
  for (let x = vb.x0 + 30; x < NY_RIVER.x0 - 35; x += 74) {
    for (let y = vb.y0 + 24; y < vb.y1; y += 64) {
      if (rnd() < 0.18) continue;
      building(g, x + (rnd() - 0.5) * 18, y + (rnd() - 0.5) * 14,
        30 + rnd() * 22, 22 + rnd() * 16, (rnd() - 0.5) * 0.1);
    }
  }
  // yellow Jersey streets
  const yroad = (pts, w) => {
    g.lineJoin = g.lineCap = "round";
    g.strokeStyle = "#d4c98f"; g.lineWidth = w + 5; path(g, pts);
    g.strokeStyle = "#f7eebc"; g.lineWidth = w; path(g, pts);
  };
  yroad([[150, vb.y0], [150, vb.y1]], 16);
  yroad([[330, vb.y0], [320, vb.y1]], 16);
  yroad([[vb.x0, 510], [NY_RIVER.x0 - 10, 505]], 14);
  // Weehawken park
  g.fillStyle = "#c8e6b8";
  UL.rr(g, 290, 60, 130, 120, 14); g.fill();
  g.fillStyle = "#3d4145"; g.font = "600 19px system-ui, sans-serif"; g.textAlign = "center";
  g.fillText("Weehawken", 250, 230);
  g.fillText("Hoboken", 200, 905);

  // ---- the Hudson ----
  g.fillStyle = "#a6cbe3";
  g.fillRect(NY_RIVER.x0, vb.y0, NY_RIVER.x1 - NY_RIVER.x0, vb.y1 - vb.y0);
  g.strokeStyle = "#8fb8d4"; g.lineWidth = 3;
  line(g, NY_RIVER.x0, vb.y0, NY_RIVER.x0, vb.y1);
  line(g, NY_RIVER.x1, vb.y0, NY_RIVER.x1, vb.y1);
  // ferry routes
  g.strokeStyle = "#7da9c9"; g.lineWidth = 2; g.setLineDash([9, 11]);
  path(g, [[NY_RIVER.x0, 200], [NY_RIVER.x1, 320]]);
  path(g, [[NY_RIVER.x0, 640], [NY_RIVER.x1, 540]]);
  line(g, (NY_RIVER.x0 + NY_RIVER.x1) / 2, vb.y0, (NY_RIVER.x0 + NY_RIVER.x1) / 2 - 14, vb.y1);
  g.setLineDash([]);
  // piers on the Manhattan bank
  g.fillStyle = "#d9d0c9"; g.strokeStyle = "#b3a698"; g.lineWidth = 1.6;
  [[150, 26], [385, 22], [555, 30], [905, 24]].forEach(p => {
    UL.rr(g, NY_RIVER.x1 - 52, p[0], 56, p[1], 3); g.fill(); g.stroke();
  });
  g.save();
  g.translate(557, 505); g.rotate(Math.PI / 2);
  g.fillStyle = "#5b86a8"; g.font = "italic 24px Georgia, serif"; g.textAlign = "center";
  g.fillText("Hudson River", 0, 0);
  g.restore();

  // ---- Manhattan: dense blocks + the avenue grid ----
  for (let x = NY_RIVER.x1 + 45; x < vb.x1; x += 66) {
    for (let y = vb.y0 + 22; y < vb.y1; y += 56) {
      if (x > 1370 && y < 240) continue;            // Central Park corner
      if (rnd() < 0.14) continue;
      building(g, x + (rnd() - 0.5) * 14, y + (rnd() - 0.5) * 10,
        30 + rnd() * 20, 20 + rnd() * 14, 0);
    }
  }
  // white cross streets
  g.strokeStyle = "#ffffff"; g.lineWidth = 8;
  for (let y = 120; y < 1000; y += 110) line(g, NY_RIVER.x1 + 10, y, vb.x1, y);
  // salmon avenues (Manhattan majors)
  const avenue = x => {
    g.strokeStyle = "#dd8f8f"; g.lineWidth = 19;
    line(g, x, vb.y0, x, vb.y1);
    g.strokeStyle = "#f0b3ad"; g.lineWidth = 14;
    line(g, x, vb.y0, x, vb.y1);
  };
  [760, 940, 1120, 1300, 1460].forEach(avenue);
  yroad([[NY_RIVER.x1 + 8, 860], [vb.x1, 850]], 16);

  // Central Park corner, top right
  g.fillStyle = "#b9e2b4";
  UL.rr(g, 1372, vb.y0 - 20, vb.x1 - 1372 + 40, 250, 14); g.fill();
  srand(5);
  for (let i = 0; i < 8; i++)
    treeGlyph(g, 1400 + rnd() * Math.max(60, vb.x1 - 1410), 20 + rnd() * 190, "#6da45c");
  g.fillStyle = "#3d4145"; g.font = "600 17px system-ui, sans-serif"; g.textAlign = "center";
  g.fillText("Central Park", 1465, 248);
  g.fillText("Manhattan", 900, 160);
  mapLabel(g, "Times Square", 990, 470, 16);
  mapLabel(g, "Hudson Yards", 740, 540, 15);

  // NY 495 shield
  g.fillStyle = "#2b4a9b";
  UL.rr(g, 666, 488, 64, 26, 5); g.fill();
  g.fillStyle = "#fff"; g.font = "bold 15px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("NY 495", 698, 502);

  // ---- the two suspension bridges under the circuit ----
  bridge(g, 280);   // north span crossing
  bridge(g, 822);   // south span crossing
}

// a suspension bridge deck across the Hudson at height y
function bridge(g, y) {
  const x0 = NY_RIVER.x0 - 28, x1 = NY_RIVER.x1 + 28;
  // deck shadow + deck
  g.fillStyle = "rgba(35,38,43,.25)";
  UL.rr(g, x0, y - 64, x1 - x0, 128, 8); g.fill();
  g.fillStyle = "#b9b2a6";
  UL.rr(g, x0, y - 70, x1 - x0, 128, 8); g.fill();
  g.strokeStyle = "#8f8779"; g.lineWidth = 3; g.stroke();
  // pylons
  g.fillStyle = "#6f6a60";
  for (const px of [x0 + 14, x1 - 26]) {
    UL.rr(g, px, y - 92, 12, 30, 3); g.fill();
    UL.rr(g, px, y + 56, 12, 30, 3); g.fill();
  }
  // suspension cables
  g.strokeStyle = "#6f6a60"; g.lineWidth = 3;
  for (const side of [-1, 1]) {
    const cy = y + side * 84;
    g.beginPath();
    g.moveTo(x0 + 20, cy - side * 6);
    g.quadraticCurveTo((x0 + x1) / 2, cy + side * 26, x1 - 20, cy - side * 6);
    g.stroke();
  }
}

/* =========================================================
   INTERLAKEN — the figure-eight between Thunersee & Brienzersee
   ========================================================= */
function paintInterlaken(g, vb) {
  srand(44);
  g.fillStyle = "#dcecc8";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);

  // alpine greens + forests
  g.fillStyle = "#cde6b0";
  [[800,120,300],[200,860,260],[1400,860,260],[80,200,200],[1520,220,220]]
    .forEach(b => blob(g, b[0], b[1], b[2]));
  g.fillStyle = "#add19e";
  [[800,60,180],[400,880,170],[1240,890,160],[60,640,130],[1550,560,140]]
    .forEach(b => blob(g, b[0], b[1], b[2]));
  for (let i = 0; i < 22; i++) {
    const spots = [[800,60,160],[400,880,150],[1240,890,140],[60,640,110],[1550,560,120]];
    const sp = spots[i % spots.length];
    treeGlyph(g, sp[0] + (rnd() - 0.5) * sp[2] * 1.6, sp[1] + (rnd() - 0.5) * sp[2] * 1.1, "#5e8a52");
  }
  // lots of orange peaks, like the Bernese Oberland map
  for (let i = 0; i < 34; i++) {
    const x = 60 + rnd() * 1480, y = 40 + rnd() * 920;
    const inL = Math.hypot(x - 400, y - 495) < 290;
    const inR = Math.hypot(x - 1190, y - 495) < 290;
    if (inL || inR) continue;
    peak(g, x, y);
  }

  // ---- the two lakes inside the lobes ----
  const lake = (pts, name, lx, ly, rot) => {
    const sm = UL.sampleSpline(pts, 10);
    g.beginPath();
    sm.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
    g.fillStyle = "#aad3df"; g.fill();
    g.strokeStyle = "#92c3d4"; g.lineWidth = 3; g.stroke();
    g.strokeStyle = "#7fb6cf"; g.lineWidth = 1.8; g.setLineDash([8, 10]);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    g.lineTo(pts[2][0], pts[2][1]);
    g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(lx, ly); g.rotate(rot);
    g.fillStyle = "#4f7d94"; g.font = "italic 22px Georgia, serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(name, 0, 0);
    g.restore();
  };
  // Thunersee, tilted like the real one (Thun NW -> Interlaken SE)
  lake([[265,395],[470,420],[620,520],[540,605],[330,600],[225,500]],
       "Thunersee", 420, 505, 0.18);
  // Brienzersee (Interlaken SW -> Brienz NE)
  lake([[975,520],[1110,420],[1310,395],[1390,490],[1270,590],[1040,600]],
       "Brienzersee", 1185, 500, -0.12);

  // ---- towns ----
  const town = (x, y, name, big) => {
    for (let k = 0; k < (big ? 6 : 3); k++)
      building(g, x + (rnd() - 0.5) * 44, y + (rnd() - 0.5) * 30, 15 + rnd() * 10, 12 + rnd() * 8, rnd() * 0.6);
    mapLabel(g, name, x, y + 30, 17);
  };
  town(135, 185, "Thun", true);
  town(165, 700, "Spiez", false);
  town(1448, 205, "Brienz", false);
  town(605, 760, "Wilderswil", false);
  // Interlaken sits in the wedge just south of the crossing
  srand(9);
  for (let k = 0; k < 7; k++)
    building(g, 800 + (rnd() - 0.5) * 80, 652 + (rnd() - 0.5) * 36, 16 + rnd() * 10, 12 + rnd() * 8, rnd() * 0.5);
  g.fillStyle = "#3d4145"; g.font = "600 22px system-ui, sans-serif"; g.textAlign = "center";
  g.fillText("Interlaken", 800, 705);

  // the lakeside road (pink, like the map) + A8 shield
  g.lineJoin = g.lineCap = "round";
  g.strokeStyle = "#d995a5"; g.lineWidth = 10;
  path(g, [[60,150],[150,330],[180,560],[290,740],[520,800],[760,690],[900,680],[1130,740],[1380,650],[1480,470],[1500,300]]);
  g.save();
  g.translate(1232, 712);
  g.fillStyle = "#f6e27a"; g.strokeStyle = "#c4ab3c"; g.lineWidth = 2;
  UL.rr(g, -22, -13, 44, 26, 5); g.fill(); g.stroke();
  g.fillStyle = "#5a4d10"; g.font = "bold 15px system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("A8", 0, 1);
  g.restore();
}

/* =========================================================
   FINNISH SAUNA — the hot room on the right, the frozen lake
   with the avanto on the left. The lap runs door to door.
   ========================================================= */
function paintSauna(g, vb) {
  srand(58);
  // ---- winter outside: snow ----
  g.fillStyle = "#eef3f7";
  g.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);
  g.fillStyle = "#e2eaf2";
  [[300,150,180],[150,850,200],[520,900,160],[80,400,150]].forEach(b => blob(g, b[0], b[1], b[2]));
  // snowy pines around the edges
  for (let i = 0; i < 16; i++) {
    const x = vb.x0 + 30 + rnd() * 620, y = vb.y0 + 20 + rnd() * (vb.y1 - vb.y0 - 40);
    if (x > 120 && x < 660 && y > 200 && y < 800) continue;   // keep the lake clear
    pine(g, x, y);
  }

  // ---- frozen lake with the avanto ----
  g.fillStyle = "#dbe9f2";
  g.strokeStyle = "#c2d6e5"; g.lineWidth = 4;
  g.beginPath(); g.ellipse(370, 500, 320, 290, 0, 0, UL.TAU); g.fill(); g.stroke();
  // cracks in the ice
  g.strokeStyle = "#c6d9e7"; g.lineWidth = 2;
  path(g, [[160,380],[300,430],[380,560],[520,640]]);
  path(g, [[300,430],[260,560]]);
  path(g, [[450,300],[420,420]]);
  // the avanto: a dark hole with an icy rim and a little ladder
  g.fillStyle = "#f5f9fc";
  blob(g, 370, 500, 72);
  g.fillStyle = "#27506e";
  blob(g, 370, 500, 56);
  g.fillStyle = "#39678a";
  blob(g, 362, 492, 40);
  g.strokeStyle = "#8a6a45"; g.lineWidth = 4;
  line(g, 412, 478, 440, 462); line(g, 416, 502, 446, 492);
  g.strokeStyle = "#8a6a45"; g.lineWidth = 3;
  line(g, 412, 478, 418, 506);
  mapLabel(g, "Avanto", 370, 585, 17);
  // steam over the open water
  steam(g, 370, 455, 4);

  // ---- the sauna building ----
  // plank floor
  g.fillStyle = "#c9a06b";
  UL.rr(g, 690, 170, 770, 660, 10);
  g.fill();
  g.strokeStyle = "rgba(120,80,40,.35)"; g.lineWidth = 2;
  for (let x = 740; x < 1450; x += 46) line(g, x, 176, x, 824);
  // benches (lauteet): two tiers along the far walls
  const bench = (x, y, w, h) => {
    g.fillStyle = "#dfb886"; g.strokeStyle = "#a87c4d"; g.lineWidth = 2.5;
    UL.rr(g, x, y, w, h, 6); g.fill(); g.stroke();
    g.strokeStyle = "rgba(120,80,40,.3)"; g.lineWidth = 1.5;
    if (w > h) { line(g, x + 6, y + h / 2, x + w - 6, y + h / 2); }
    else { line(g, x + w / 2, y + 6, x + w / 2, y + h - 6); }
  };
  bench(720, 186, 700, 38);          // upper tier, top wall
  bench(760, 230, 620, 30);          // lower tier
  bench(1390, 240, 38, 520);         // upper tier, right wall
  bench(1352, 300, 30, 400);
  bench(720, 776, 700, 38);          // upper tier, bottom wall
  bench(760, 740, 620, 30);
  // towels on the benches
  g.fillStyle = "#e84a33"; UL.rr(g, 840, 190, 60, 30, 4); g.fill();
  g.fillStyle = "#4f86c6"; UL.rr(g, 1180, 782, 60, 28, 4); g.fill();
  g.fillStyle = "#3fa66b"; UL.rr(g, 1394, 430, 30, 56, 4); g.fill();

  // the kiuas (stove) in the middle of the hot room
  g.fillStyle = "#3a3d44"; g.strokeStyle = "#23262b"; g.lineWidth = 3;
  UL.rr(g, 1020, 440, 120, 120, 12); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,140,40,.5)";                       // glow
  blob(g, 1080, 500, 44);
  srand(13);
  for (let i = 0; i < 12; i++) {                              // stones
    g.fillStyle = i % 3 ? "#6e7177" : "#8a8d93";
    blob(g, 1045 + rnd() * 72, 465 + rnd() * 72, 9 + rnd() * 6);
  }
  steam(g, 1080, 415, 5);                                     // löyly!
  mapLabel(g, "Kiuas", 1080, 595, 16);
  // bucket + ladle + vihta by the stove
  g.fillStyle = "#9a6f42"; g.strokeStyle = "#6f4d2a"; g.lineWidth = 2.5;
  g.beginPath(); g.arc(965, 575, 20, 0, UL.TAU); g.fill(); g.stroke();
  g.fillStyle = "#b9d9ea"; g.beginPath(); g.arc(965, 575, 13, 0, UL.TAU); g.fill();
  g.strokeStyle = "#6f4d2a"; g.lineWidth = 3.5;
  line(g, 978, 562, 1002, 540);
  g.fillStyle = "#5e8a52";
  blob(g, 1195, 585, 13); blob(g, 1208, 575, 11); blob(g, 1186, 572, 10);
  g.strokeStyle = "#8a6a45"; g.lineWidth = 3;
  line(g, 1196, 590, 1212, 612);

  // log walls, with two door gaps on the lake side
  g.strokeStyle = "#7a5230"; g.lineWidth = 18; g.lineCap = "butt";
  line(g, 690, 170, 1460, 170);                 // top
  line(g, 1460, 170, 1460, 830);                // right
  line(g, 690, 830, 1460, 830);                 // bottom
  line(g, 690, 170, 690, 245);                  // left, above the top door
  line(g, 690, 400, 690, 600);                  // left, between the doors
  line(g, 690, 755, 690, 830);                  // left, below the bottom door
  // door thresholds
  g.fillStyle = "#a87c4d";
  UL.rr(g, 678, 247, 24, 151, 4); g.fill();
  UL.rr(g, 678, 602, 24, 151, 4); g.fill();
  // window on the right wall
  g.fillStyle = "#bfe0f0"; g.strokeStyle = "#7a5230"; g.lineWidth = 4;
  UL.rr(g, 1450, 470, 20, 90, 3); g.fill(); g.stroke();
  // wall thermometer, pleasantly worrying
  g.fillStyle = "#f5f2ea"; g.strokeStyle = "#23262b"; g.lineWidth = 2;
  g.beginPath(); g.arc(1290, 205, 17, 0, UL.TAU); g.fill(); g.stroke();
  g.strokeStyle = "#d8311f"; g.lineWidth = 2.5;
  line(g, 1290, 205, 1300, 193);
  g.fillStyle = "#23262b"; g.font = "bold 11px system-ui, sans-serif";
  g.textAlign = "center"; g.fillText("90°", 1290, 238);

  // duckboard dock between the doors and the lake
  g.fillStyle = "#b08756";
  UL.rr(g, 596, 290, 90, 70, 6); g.fill();
  UL.rr(g, 596, 640, 90, 70, 6); g.fill();
  g.strokeStyle = "rgba(120,80,40,.4)"; g.lineWidth = 2;
  for (let x = 606; x < 680; x += 14) { line(g, x, 296, x, 354); line(g, x, 646, x, 704); }

  // big label burned into the top wall
  g.fillStyle = "#5a3a1e";
  g.font = "700 30px Georgia, serif";
  g.textAlign = "center";
  g.fillText("S A U N A", 1075, 152);
}

function pine(g, x, y) {
  g.fillStyle = "#3e6b4a";
  g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 11, y + 8); g.lineTo(x - 11, y + 8); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 14, y + 16); g.lineTo(x - 14, y + 16); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.7)";                       // snow caps
  g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 6, y - 3); g.lineTo(x - 6, y - 3); g.closePath(); g.fill();
}

function steam(g, x, y, n) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = "rgba(255,255,255," + (0.5 - i * 0.08) + ")";
    blob(g, x + Math.sin(i * 1.7) * 14, y - i * 24, 12 + i * 5);
  }
}
