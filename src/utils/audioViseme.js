
// utils/audioViseme.js — Realtime viseme detector from audio (mic/file) — heuristic, no ML
import { getAudioContext } from './audio.js';

export class AudioVisemeDetector {
  constructor(audioCtx = getAudioContext(), opts = {}) {
    this.ac = audioCtx;
    this.fftSize = opts.fftSize ?? 2048;
    this.smoothing = opts.smoothing ?? 0.85;
    this.simpleMode = (opts.simpleMode ?? true);
    this.sibilantThreshHz = 3000;
    this.sibilantHighRatio = 0.40;
    this.fluxFF = 0.18;
    this.minRMS = opts.minRMS ?? 0.025;   // silence threshold (slightly higher to avoid chattering)
    this.attack = opts.attack ?? 0.18;    // smooth up
    this.release = opts.release ?? 0.28;  // smooth down
    this.prevRMS = 0;
    this.prevSpec = null;
    this.prevCentroid = 0;
    this.curViseme = 'sil';
    this.curStrength = 0;

    this.analyser = this.ac.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothing;
    this.timeData = new Float32Array(this.analyser.fftSize);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  connectSource(srcNode) {
    if (this.source) try { this.source.disconnect(); } catch {}
    this.source = srcNode;
    this.source.connect(this.analyser);
  }

  static async fromMic(constraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }}) {
    const ac = getAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const src = ac.createMediaStreamSource(stream);
    const det = new AudioVisemeDetector(ac);
    det.connectSource(src);
    return {detector: det, stream};
  }

  // feature helpers
  _rms() {
    this.analyser.getFloatTimeDomainData(this.timeData);
    let sum = 0;
    for (let i=0;i<this.timeData.length;i++) {
      const v = this.timeData[i];
      sum += v*v;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  _zcr() {
    let z=0;
    let prev = this.timeData[0];
    for (let i=1;i<this.timeData.length;i++) {
      const cur = this.timeData[i];
      if ((prev>=0 && cur<0) || (prev<0 && cur>=0)) z++;
      prev = cur;
    }
    return z / this.timeData.length;
  }

  _bands() {
    // compute energy per band using frequency data (0..255)
    this.analyser.getByteFrequencyData(this.freqData);
    const sr = this.ac.sampleRate || 48000;
    const n = this.freqData.length;
    const hzPerBin = sr/(2*n);

    function bandSum(lo, hi, arr) {
      const ilo = Math.max(0, Math.floor(lo/hzPerBin));
      const ihi = Math.min(n-1, Math.floor(hi/hzPerBin));
      let s=0;
      for (let i=ilo;i<=ihi;i++) s += arr[i];
      return s / (ihi-ilo+1);
    }

    const b = {
      b0: bandSum(0, 300, this.freqData),
      b1: bandSum(300, 800, this.freqData),
      b2: bandSum(800, 2000, this.freqData),
      b3: bandSum(2000, 5000, this.freqData),
      b4: bandSum(5000, 10000, this.freqData)
    };
    b.sum = b.b0+b.b1+b.b2+b.b3+b.b4;
    b.low = (b.b0 + b.b1);
    b.mid = (b.b2);
    b.high = (b.b3 + b.b4);
    // spectral centroid (rough)
    let num=0, den=0;
    for (let i=0;i<n;i++){ const f=i*hzPerBin; const a=this.freqData[i]; num+=f*a; den+=a; }
    b.centroid = den>0 ? (num/den) : 0;
    return b;
  }

  _flux(cur) {
    // spectral flux vs previous (sum positive deltas)
    if (!this.prevSpec) { this.prevSpec = cur.slice(); return 0; }
    let s=0;
    for (let i=0;i<cur.length;i++){
      const d = cur[i]-this.prevSpec[i];
      if (d>0) s+=d;
      this.prevSpec[i]=cur[i];
    }
    return s/(cur.length*255);
  }


  update(dt=0.016) {
    if (!this.analyser) return null;
    const rms = this._rms();
    const target = Math.max(0, (rms - this.minRMS) / 0.25);
    const k = target > this.curStrength ? this.attack : this.release;
    this.curStrength = this.curStrength + (target - this.curStrength) * (1 - Math.exp(-dt / Math.max(1e-3,k)));

    // spectral features
    const zcr = this._zcr();
    const curSpec = new Uint8Array(this.freqData.length);
    this.analyser.getByteFrequencyData(curSpec);
    const b = this._bands();
    const flux = this._flux(curSpec);

    const level = this.curStrength;
    let code = 'sil';

    if (level > 0.01) {
      // Prefer vowels first — more natural mouth
      const centroid = this.prevCentroid;
      if (this.simpleMode) {
        if (b.low > 0.45 && centroid < 1100) code = 'aa';
        else if (centroid < 1400 && b.mid > 0.30) code = 'O';
        else if (centroid < 2000) code = 'E';
        else if (centroid < 2600) code = 'I';
        else code = 'E';
      } else {
        if (b.low > 0.48 && centroid < 1100) code = 'aa';
        else if (b.mid > 0.40 && centroid < 1600) code = 'O';
        else if (centroid < 2100) code = 'E';
        else if (centroid < 2800) code = 'I';
        else code = 'E';
      }

      // Strong consonant overrides
      if (b.high > this.sibilantHighRatio && this.prevCentroid > this.sibilantThreshHz && flux > 0.12 && level > 0.08) {
        code = 'SS';
      } else if (flux > this.fluxFF && b.low < 0.3 && centroid < 1600) {
        code = 'FF';
      } else if (b.mid > 0.38 && centroid > 1500 && centroid < 2400 && flux > 0.08) {
        code = 'TH';
      }
    } else {
      code = 'sil';
    }

    this.prevSpec = curSpec;
    this.curViseme = code;
    return { code, intensity: Math.max(0, Math.min(1, level)) };
  }
}
