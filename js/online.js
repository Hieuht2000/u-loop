"use strict";
/* u-loop · online.js — shared leaderboard adapter (Supabase REST).
   Does nothing unless config.js enables a provider; the game falls
   back to local records whenever the network is unreachable. */

UL.online = (() => {
  const cfg = (UL.CONFIG && UL.CONFIG.leaderboard) || { provider: "none" };
  const enabled = cfg.provider === "supabase" && !!cfg.url && !!cfg.anonKey;
  const base = enabled ? cfg.url.replace(/\/+$/, "") + "/rest/v1/records" : null;
  // Legacy JWT anon keys (eyJ...) are sent as both apikey and Bearer.
  // New publishable keys (sb_publishable_...) must NOT be sent as
  // Authorization: Bearer — apikey alone is correct for them.
  const headers = enabled ? (() => {
    const h = { "apikey": cfg.anonKey, "Content-Type": "application/json" };
    if (/^eyJ/.test(cfg.anonKey)) h["Authorization"] = "Bearer " + cfg.anonKey;
    return h;
  })() : null;

  // top 12 averages for one track, mapped to the local board format
  async function fetchBoard(trackId) {
    if (!enabled) return null;
    try {
      const url = base +
        "?track=eq." + encodeURIComponent(trackId) +
        "&select=name,ms,car,created_at&order=ms.asc&limit=12";
      const r = await fetch(url, { headers });
      if (!r.ok) return null;
      const rows = await r.json();
      if (!Array.isArray(rows)) return null;
      return rows.map(x => ({
        n: String(x.name || "?").slice(0, 16),
        ms: +x.ms,
        c: x.car,
        d: String(x.created_at || "").slice(0, 10)
      }));
    } catch (e) { return null; }
  }

  async function submit(trackId, entry) {
    if (!enabled) return false;
    try {
      const r = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify({
          track: trackId,
          name: String(entry.n || "anonymous").slice(0, 16),
          ms: Math.round(entry.ms),
          car: entry.c || null
        })
      });
      return r.ok;
    } catch (e) { return false; }
  }

  return { get enabled() { return enabled; }, fetchBoard, submit };
})();
