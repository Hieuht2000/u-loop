"use strict";
/* u-loop · utils.js — shared helpers, defines the global UL namespace */

const UL = (window.UL = {});

UL.TAU = Math.PI * 2;
UL.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
UL.lerp = (a, b, t) => a + (b - a) * t;
UL.dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};

// milliseconds -> "12.345" or "1:02.345"
UL.fmt = function (ms) {
  if (ms == null) return "—";
  const s = ms / 1000;
  if (s < 60) return s.toFixed(3);
  const m = Math.floor(s / 60);
  return m + ":" + (s - m * 60).toFixed(3).padStart(6, "0");
};

UL.getCSS = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// rounded rectangle path on any 2d context
UL.rr = function (g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

// base64url JSON (unicode-safe) — used for shareable challenge links
UL.b64e = function (obj) {
  const json = JSON.stringify(obj);
  const utf8 = unescape(encodeURIComponent(json));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
UL.b64d = function (str) {
  try {
    const b = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b)));
    return JSON.parse(json);
  } catch (e) { return null; }
};

UL.escapeHTML = s => String(s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
