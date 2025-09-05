// utils/lipsyncMap.js — reset agressivo + mapeamento simétrico (sem assimetrias)
import { safeSetMorph, findFirstMeshWithMorph } from './safeMorph.js'

const R = {
  V: {
    None:        ['V_None'],
    Open:        ['V_Open','V_Lip_Open'],
    Explosive:   ['V_Explosive'],              // PP
    DentalLip:   ['V_Dental_Lip'],             // FF
    TightO:      ['V_Tight_O'],                // O
    Tight:       ['V_Tight'],                  // U / RR
    Wide:        ['V_Wide'],                   // I/E
    Affricate:   ['V_Affricate'],              // SS/DD fallback
    TongueUp:    ['V_Tongue_up'],              // nn
    TongueRaise: ['V_Tongue_Raise'],           // kk
    TongueOut:   ['V_Tongue_Out'],             // TH
  },
  JawOpen: ['Jaw_Open','Mouth_Open']           // mandíbula por morph
};

// --- helpers ---
function setAny(mesh, names, v){
  if (!mesh) return false
  for (const n of names) if (safeSetMorph(mesh, n, v)) return true
  return false
}

// ZERA tudo que possa perturbar a boca (prefix match: V_, Mouth_, Jaw_, Tongue_)
export function resetMouth(mesh){
  if (!mesh?.morphTargetDictionary) return
  const dict = mesh.morphTargetDictionary
  for (const name of Object.keys(dict)){
    if (/^(V_|Mouth_|Jaw_|Tongue_)/.test(name)) {
      safeSetMorph(mesh, name, 0)
    }
  }
}

// escolhe a malha com mais morphs relevantes
export function pickFaceMesh(root){
  const want = [
    ...Object.values(R.V).flat(),
    ...R.JawOpen,
    // alguns comuns de boca para scoring
    'Mouth_Close','Mouth_Press_L','Mouth_Press_R'
  ]
  let best=null, score=-1
  root.traverse(o=>{
    if (o.isMesh && o.morphTargetDictionary){
      const d=o.morphTargetDictionary
      let s=0; for (const k of want) if (k in d) s++
      if (s>score){ best=o; score=s }
    }
  })
  if (!best) best = findFirstMeshWithMorph(root, ...want) || null
  return best
}

export function debugFace(root, mesh){
  const m = mesh || pickFaceMesh(root)
  const has = k => !!m?.morphTargetDictionary?.hasOwnProperty(k)
  console.log('[LIPSYNC] faceMesh =', m?.name, 'morphs=', Object.keys(m?.morphTargetDictionary||{}).length)
  ;['V_Open','V_Wide','V_Tight_O','V_Tight','V_Explosive','V_Dental_Lip','V_Affricate','V_Tongue_Out','Jaw_Open','Mouth_Close']
    .forEach(k => console.log('  has', k, ':', has(k)))
}

/**
 * Aplica um visema (Oculus) com intensidade s (0..1).
 * Simétrico, sem acionar morphs L/R individuais (evita boca torta).
 */
export function applyViseme(mesh, jawBone, code, s){
  s = Math.max(0, Math.min(1, s||0))
  resetMouth(mesh)

  // ganhos (ajusta à tua malha)
  const JAW = 0.9, VG = 1.0

  // mandíbula via morph; fallback: osso (se quiseres, ativa)
  const jaw = amt => {
    if (!setAny(mesh, R.JawOpen, amt)) {
      // Fallback por osso (descomenta se precisares)
      // if (jawBone) jawBone.rotation.x = -amt * (Math.PI/8)
    }
  }

  switch (code) {

    // Consoantes
    case 'PP': // p/b/m — lábios fechados/explosivo
      setAny(mesh, R.V.Explosive, VG*s) || safeSetMorph(mesh, 'Mouth_Close', 1.0*s)
      jaw(0.0)
      break

    case 'FF': // f/v — dente-lábio
      setAny(mesh, R.V.DentalLip, VG*s)
      jaw(0.25*s)
      break

    case 'TH': // θ/ð — língua fora
      setAny(mesh, R.V.TongueOut, VG*s)
      jaw(0.35*s)
      break

    case 'SS': // s/ʃ/ʧ
    case 'DD': // t/d
      setAny(mesh, R.V.Affricate, 0.8*VG*s)
      jaw(0.18*s)
      break

    case 'kk': // k/g — posterior
      setAny(mesh, R.V.TongueRaise, VG*s)
      jaw(0.30*s)
      break

    case 'nn': // n/l — ponta língua
      setAny(mesh, R.V.TongueUp, VG*s)
      jaw(0.15*s)
      break

    case 'RR': // r-coloring — leve aperto
      setAny(mesh, R.V.Tight, 0.7*VG*s)
      jaw(0.28*s)
      break

    // Vogais (simétricas)
    case 'aa': // aberto
      setAny(mesh, R.V.Open, VG*s)
      jaw(JAW*s)
      break

    case 'E':  // médio
      setAny(mesh, R.V.Wide, VG*s)
      jaw(0.6*JAW*s)
      break

    case 'I':  // estirado
      setAny(mesh, R.V.Wide, VG*s)
      jaw(0.4*JAW*s)
      break

    case 'O':  // redondo
      setAny(mesh, R.V.TightO, VG*s)
      jaw(0.55*JAW*s)
      break

    case 'U':  // bico
      setAny(mesh, R.V.Tight, VG*s)
      jaw(0.35*JAW*s)
      break

    default:   // 'sil'
      setAny(mesh, R.V.None, 0)
      jaw(0)
  }
}
