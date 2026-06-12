"use strict";
/* u-loop · storage.js — localStorage persistence (guarded, degrades gracefully) */

UL.store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

UL.records = (() => {
  const bestKey  = id => "uloop.best."  + id;
  const boardKey = id => "uloop.board." + id;
  const MAX_BOARD = 12;

  function best(id) {
    const v = UL.store.get(bestKey(id));
    return v ? +v : null;
  }

  function saveBest(id, ms) {
    UL.store.set(bestKey(id), String(Math.round(ms)));
  }

  // ---- named record board (per track) ----
  // entry: { n: name, ms, c: carId, d: dateISO, f: 1 if from a friend's link }
  function board(id) {
    const v = UL.store.get(boardKey(id));
    if (!v) return [];
    try { const b = JSON.parse(v); return Array.isArray(b) ? b : []; }
    catch (e) { return []; }
  }

  function addToBoard(id, entry) {
    const b = board(id);
    const dup = b.some(e => e.n === entry.n && Math.round(e.ms) === Math.round(entry.ms));
    if (!dup) b.push(entry);
    b.sort((a, c) => a.ms - c.ms);
    b.length = Math.min(b.length, MAX_BOARD);
    UL.store.set(boardKey(id), JSON.stringify(b));
    return b;
  }

  function clearBoard(id) { UL.store.del(boardKey(id)); }

  function playerName(set) {
    if (set !== undefined) UL.store.set("uloop.player", set);
    return UL.store.get("uloop.player") || "";
  }

  function selectedCar(set) {
    if (set !== undefined) UL.store.set("uloop.car", set);
    return UL.store.get("uloop.car");
  }

  // true once any track other than exceptId has a saved best —
  // i.e. the player has finished at least one race elsewhere
  function playedAny(exceptId) {
    return UL.TRACKS.some(t => t.id !== exceptId && best(t.id) != null);
  }

  return {
    playedAny, best, saveBest, board, addToBoard, clearBoard, playerName, selectedCar };
})();
