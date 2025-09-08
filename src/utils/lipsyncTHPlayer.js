// utils/lipsyncTHPlayer.js — Reprodutor de lipsync “igual ao TalkingHead”
import { applyViseme, resetMouth } from './lipsyncMap.js';
import { LipsyncEn } from '../lib/lipsync-en.mjs'; // ficheiro que enviaste

const lipsync = new LipsyncEn();

export function preprocessTH(text){
  return lipsync.preProcessText(text);
}
export function wordsToVisemesTH(word){
  return lipsync.wordsToVisemes(word);
}

/**
 * Reproduz texto “estilo TalkingHead”
 */
export function playTextTH(root, text, opts = {}){
  const wrd = lipsync.preProcessText(text);
  const seq = lipsync.wordsToVisemes(wrd);
  return playSequenceTH(root, seq, opts);
}

/**
 * Reproduz uma sequência {visemes,times,durations} no estilo TalkingHead
 */
export function playSequenceTH(root, seq, {
  durationPerViseme = 200, // ms
  peakBoostPPFF = 0.9,
  baseLevel = 0.8,
  onDone = null,
} = {}){
  const v = seq?.visemes || [];
  const t = seq?.times || [];
  const d = seq?.durations || [];
  if (!v.length) return () => {};

  const totalMs = Math.max(1, v.length * durationPerViseme);
  const endRel = t[v.length - 1] + d[v.length - 1];
  const norm = endRel > 0 ? (totalMs / endRel) : durationPerViseme;

  const ramps = [];
  for (let i = 0; i < v.length; i++){
    const tAbs = t[i] * norm;
    const dAbs = d[i] * norm;

    const t0 = Math.max(0, tAbs - Math.min(60, (2 * dAbs) / 3));
    const t1 = tAbs + Math.min(25, dAbs / 2);
    const t2 = tAbs + dAbs + Math.min(60, dAbs / 2);

    const code = v[i];
    const peak = (code === 'PP' || code === 'FF') ? peakBoostPPFF : baseLevel;

    ramps.push({ code, t0, t1, t2, peak });
  }

  const start = performance.now();
  let cancelled = false;
  const rafs = new Set();

  const step = () => {
    if (cancelled) return;
    const now = performance.now() - start;

    let active = null;
    for (let i=0;i<ramps.length;i++){
      const r = ramps[i];
      if (now >= r.t0 && now <= r.t2) active = r;
    }

    if (active){
      let level = 0;
      if (now <= active.t1){
        const a = (now - active.t0) / Math.max(1, (active.t1 - active.t0));
        level = Math.max(0, Math.min(1, a)) * active.peak;
      } else {
        const a = 1 - (now - active.t1) / Math.max(1, (active.t2 - active.t1));
        level = Math.max(0, Math.min(1, a)) * active.peak;
      }
      applyViseme(root, active.code, level);
      const id = requestAnimationFrame(step);
      rafs.add(id);
    } else {
      if (now > ramps[ramps.length-1].t2){
        resetMouth(root);
        onDone && onDone();
        return;
      }
      const id = requestAnimationFrame(step);
      rafs.add(id);
    }
  };

  const id = requestAnimationFrame(step);
  rafs.add(id);

  return function cancel(){
    cancelled = true;
    for (const r of rafs) cancelAnimationFrame(r);
    resetMouth(root);
  };
}
