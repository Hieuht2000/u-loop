"use strict";
/* u-loop · audio.js — beeps + a tiny synthesized engine per vehicle.
   No audio files; everything is WebAudio oscillators. The engine pitch
   follows the car's speed, with a different voice per vehicle. */

UL.audio = (() => {
  let AC = null;
  let muted = false;
  try { muted = localStorage.getItem("uloop.mute") === "1"; } catch (e) {}
  function ctx() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    return AC;
  }

  function beep(freq, dur = 0.09, vol = 0.12, type = "sine") {
    if (muted) return;
    try {
      const A = ctx();
      const o = A.createOscillator(), g = A.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, A.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + dur);
      o.connect(g); g.connect(A.destination);
      o.start(); o.stop(A.currentTime + dur);
    } catch (e) {}
  }

  /* engine voices — f0 idle pitch, f1 full-speed pitch,
     detune adds a second growling oscillator,
     lfo gives the put-put / rumble character */
  const VOICES = {
    f11: { type: "sawtooth", f0: 70,  f1: 215, detune: 0, lfoF: 0,  lfoA: 0   },
    x20:    { type: "sawtooth", f0: 95,  f1: 335, detune: 7, lfoF: 0,  lfoA: 0   },
    f9: { type: "square",   f0: 58,  f1: 185, detune: 4, lfoF: 0,  lfoA: 0   },
    f10:    { type: "square",   f0: 42,  f1: 112, detune: 0, lfoF: 9,  lfoA: 0.5 },
    sa:   { type: "sawtooth", f0: 135, f1: 440, detune: 0, lfoF: 24, lfoA: 0.6 },
    sbb:      { type: "triangle", f0: 62,  f1: 175, detune: 5, lfoF: 11, lfoA: 0.45 }
  };
  const BASE_GAIN = 0.045;
  let eng = null;

  function engineStart(carId) {
    if (muted) return;
    try {
      const A = ctx();
      engineStop();
      const cfg = VOICES[UL.CAR_ID_ALIASES && UL.CAR_ID_ALIASES[carId] || carId] || VOICES.f11;
      const g = A.createGain(); g.gain.value = 0;
      const lp = A.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 800;
      const o1 = A.createOscillator(); o1.type = cfg.type; o1.frequency.value = cfg.f0;
      o1.connect(lp);
      let o2 = null;
      if (cfg.detune) {
        o2 = A.createOscillator(); o2.type = cfg.type;
        o2.frequency.value = cfg.f0 + cfg.detune;
        o2.connect(lp);
      }
      let lfo = null, lfoG = null;
      if (cfg.lfoF) {
        lfo = A.createOscillator(); lfo.type = "sine"; lfo.frequency.value = cfg.lfoF;
        lfoG = A.createGain(); lfoG.gain.value = BASE_GAIN * cfg.lfoA;
        lfo.connect(lfoG); lfoG.connect(g.gain);
        lfo.start();
      }
      lp.connect(g); g.connect(A.destination);
      o1.start(); if (o2) o2.start();
      g.gain.linearRampToValueAtTime(BASE_GAIN, A.currentTime + 0.35);
      eng = { A, cfg, g, lp, o1, o2, lfo };
    } catch (e) {}
  }

  // r: 0..1 speed ratio; off: true while on the grass
  function engineSet(r, off) {
    if (!eng) return;
    try {
      const { A, cfg } = eng;
      const f = (cfg.f0 + (cfg.f1 - cfg.f0) * UL.clamp(r, 0, 1)) * (off ? 0.9 : 1);
      eng.o1.frequency.setTargetAtTime(f, A.currentTime, 0.05);
      if (eng.o2) eng.o2.frequency.setTargetAtTime(f + cfg.detune, A.currentTime, 0.05);
      eng.lp.frequency.setTargetAtTime(off ? 450 : 800 + 700 * r, A.currentTime, 0.08);
    } catch (e) {}
  }

  function engineStop() {
    if (!eng) return;
    const e = eng; eng = null;
    try {
      e.g.gain.setTargetAtTime(0.0001, e.A.currentTime, 0.05);
      setTimeout(() => {
        try { e.o1.stop(); if (e.o2) e.o2.stop(); if (e.lfo) e.lfo.stop(); } catch (x) {}
      }, 350);
    } catch (x) {}
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem("uloop.mute", muted ? "1" : "0"); } catch (e) {}
    if (muted) engineStop();
  }
  function isMuted() { return muted; }

  return { ctx, beep, engineStart, engineSet, engineStop, setMuted, isMuted };
})();

// kept as a short alias — used all over the game
UL.beep = UL.audio.beep;
