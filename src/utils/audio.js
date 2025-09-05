// utils/audio.js
let ctx = null;
export function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
export async function resumeAudioContext() {
  try {
    const ac = getAudioContext();
    if (ac.state !== 'running') await ac.resume();
    return ac.state;
  } catch (e) {
    return 'error: ' + (e?.message || e);
  }
}
