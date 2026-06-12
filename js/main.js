"use strict";
/* u-loop · main.js — input + main loop + boot */

(() => {
  const S = UL.game.S;
  const cv = document.getElementById("game");

  function press(on) { UL.game.setInput(on); }

  window.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (UL.ui.overlayOpen()) return;        // typing a name, ignore game keys
    if (e.code === "Space" || e.code === "ArrowLeft") { press(true); e.preventDefault(); }
    if (e.code === "Escape" && S.mode !== "menu") UL.ui.toMenu();
    if (e.code === "KeyR" && (S.mode === "racing" || S.mode === "countdown")) UL.game.restartLap();
    if (e.code === "KeyR" && S.mode === "finished") UL.ui.resultsAgain();
  });
  window.addEventListener("keyup", e => {
    if (e.code === "Space" || e.code === "ArrowLeft") press(false);
  });
  cv.addEventListener("pointerdown", e => { press(true); e.preventDefault(); });
  window.addEventListener("pointerup", () => press(false));
  window.addEventListener("pointercancel", () => press(false));
  window.addEventListener("blur", () => press(false));

  let last = performance.now();
  function frame(now) {
    const dt = UL.clamp((now - last) / 1000, 0, 0.04);
    last = now;
    UL.game.update(dt);
    UL.renderer.render(S);
    requestAnimationFrame(frame);
  }

  UL.ui.buildMenu();
  UL.ui.handleChallengeLink();
  requestAnimationFrame(frame);
})();
