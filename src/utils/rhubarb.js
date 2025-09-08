
// utils/rhubarb.js — Parse Rhubarb Lip Sync output to TalkingHead-style sequence
// Supports JSON and CSV exported by Rhubarb (github.com/DanielSWolf/rhubarb-lip-sync)
export function parseRhubarb(input, opts = {}){
  const map = {
    'A': 'aa', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
    'C': 'SS',   // consonants (s,z) -> fricative
    'F': 'FF',   // f,v labiodental
    'L': 'DD',   // l,d,t -> alveolar
    'M': 'PP',   // m,b,p -> bilabial
    'W': 'U',    // w -> rounded
    'R': 'E',    // r -> mid vowel-ish
    'S': 'SS',   // s,sh,zh
    'TH': 'TH',
    '-': 'sil'
  };
  function push(arr, v){ arr.push(v); }
  function fin(seq){
    if (!seq.visemes.length){
      seq.visemes = ['sil']; seq.times=[0]; seq.durations=[0.3];
    }
    return seq;
  }
  if (typeof input === 'string'){
    input = input.trim();
    // JSON?
    if (input.startsWith('{') || input.startsWith('[')){
      try {
        const data = JSON.parse(input);
        const markers = Array.isArray(data) ? data : data.mouthCues || data.cues || data.markers || [];
        const seq = { visemes: [], times: [], durations: [] };
        for (const m of markers){
          const t0 = Number(m.start) || Number(m.time) || 0;
          const dur = (Number(m.end) || (Number(m.duration)||0) + t0) - t0;
          const p = String(m.value || m.phoneme || m.code || m.mouth) || '-';
          const v = map[p] || 'sil';
          push(seq.visemes, v); push(seq.times, t0); push(seq.durations, Math.max(0.06, dur||0.12));
        }
        return fin(seq);
      } catch(e){ /* fallthrough to CSV */ }
    }
    // CSV: start,end,phoneme
    const lines = input.split(/[\r\n]+/).filter(Boolean);
    if (lines.length){
      const seq = { visemes: [], times: [], durations: [] };
      for (const ln of lines){
        const parts = ln.split(',');
        if (parts.length >= 3){
          const t0 = Number(parts[0])||0;
          const t1 = Number(parts[1])||0;
          const p = parts[2].trim();
          const v = map[p] || 'sil';
          push(seq.visemes, v); push(seq.times, t0); push(seq.durations, Math.max(0.06, (t1-t0)||0.12));
        }
      }
      return fin(seq);
    }
  }
  // Already object?
  if (Array.isArray(input)){
    return fin({ visemes: input.map(x=>map[x.phoneme]||'sil'),
      times: input.map(x=>x.start||x.time||0),
      durations: input.map(x=>(x.end||0)-(x.start||x.time||0)) });
  }
  return fin({ visemes: ['sil'], times:[0], durations:[0.3] });
}
