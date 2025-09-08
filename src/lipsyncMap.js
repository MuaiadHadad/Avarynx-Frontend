// utils/lipsyncMap.js — sistema de lipsync otimizado para avatar Camila
import { safeSetMorph } from './safeMorph.js'

// Mapeamento otimizado para o avatar Camila com morph targets específicos
const VISEME_MAP = {
  V: {
    None:        ['V_None'],
    Open:        ['V_Open', 'V_Lip_Open'],
    Explosive:   ['V_Explosive', 'Mouth_Press_L', 'Mouth_Press_R'],
    DentalLip:   ['V_Dental_Lip', 'Mouth_Funnel_Up_L', 'Mouth_Funnel_Up_R', 'Mouth_Funnel_Down_L', 'Mouth_Funnel_Down_R'],
    TightO:      ['V_Tight_O', 'Mouth_Pucker_Up_L', 'Mouth_Pucker_Up_R', 'Mouth_Pucker_Down_L', 'Mouth_Pucker_Down_R'],
    Tight:       ['V_Tight', 'Mouth_Pucker_Up_L', 'Mouth_Pucker_Up_R'],
    Wide:        ['V_Wide', 'Mouth_Smile_L', 'Mouth_Smile_R', 'Mouth_Stretch_L', 'Mouth_Stretch_R'],
    Affricate:   ['V_Affricate', 'Mouth_Tighten_L', 'Mouth_Tighten_R'],
    TongueUp:    ['V_Tongue_up', 'V_Tongue_Raise'],
    TongueRaise: ['V_Tongue_Raise', 'V_Tongue_Up'],
    TongueOut:   ['V_Tongue_Out'],
    CH:          ['Mouth_Tighten_L', 'Mouth_Tighten_R', 'V_Affricate'],
    RR:          ['V_RR', 'Mouth_Funnel_Up_L', 'Mouth_Funnel_Up_R']
  },
  JawOpen: ['CC_Base_JawRoot'] // Usar o bone específico encontrado
};

// Intensidade dos visemas (0.0 a 1.0)
const VISEME_INTENSITY = {
  'aa': 0.8,  // Open vowel
  'E': 0.6,   // Mid vowel
  'I': 0.5,   // Close vowel
  'O': 0.7,   // Round vowel
  'U': 0.6,   // Close round vowel
  'PP': 0.9,  // Bilabial stop
  'SS': 0.7,  // Fricative
  'TH': 0.5,  // Dental fricative
  'DD': 0.8,  // Alveolar stop
  'FF': 0.7,  // Labiodental fricative
  'kk': 0.8,  // Velar stop
  'nn': 0.6,  // Nasal
  'RR': 0.6,  // Rhotic
  'CH': 0.8,  // Affricate
  'sil': 0.0  // Silence
};

// Mapeamento de abertura da mandíbula por visema
const JAW_OPENING = {
  'aa': 0.8,  // Wide open
  'E': 0.4,   // Medium open
  'I': 0.2,   // Slightly open
  'O': 0.5,   // Medium open with rounding
  'U': 0.3,   // Slightly open with rounding
  'PP': 0.0,  // Closed
  'SS': 0.1,  // Very slightly open
  'TH': 0.2,  // Slightly open
  'DD': 0.3,  // Medium open
  'FF': 0.1,  // Very slightly open
  'kk': 0.2,  // Slightly open
  'nn': 0.2,  // Slightly open
  'RR': 0.3,  // Medium open
  'CH': 0.2,  // Slightly open
  'sil': 0.0  // Closed
};

// --- helpers aprimorados ---
function setAny(mesh, names, value, intensity = 1.0) {
  if (!mesh) return false;
  const adjustedValue = value * intensity;
  let applied = false;

  for (const name of names) {
    if (safeSetMorph(mesh, name, adjustedValue)) {
      applied = true;
      console.log(`✅ Aplicado morph: ${name} = ${adjustedValue.toFixed(3)}`);
    }
  }
  return applied;
}

// ZERA tudo que possa perturbar a boca de forma mais abrangente
export function resetMouth(mesh) {
  if (!mesh?.morphTargetDictionary) return;
  const dict = mesh.morphTargetDictionary;

  // Padrões mais abrangentes para reset
  const resetPatterns = [
    /^(V_|Mouth_|Jaw_|Tongue_|Lip_|viseme_)/i,
    /^(mouthOpen|mouthClose|mouthSmile|mouthFrown)/i,
    /^(mouthPress|mouthPucker|mouthFunnel|mouthShrugUpper)/i,
    /^(jawOpen|jawForward|tongueUp|tongueOut)/i
  ];

  for (const name of Object.keys(dict)) {
    if (resetPatterns.some(pattern => pattern.test(name))) {
      safeSetMorph(mesh, name, 0);
    }
  }
}

// Escolhe a malha com mais morphs relevantes de forma mais inteligente

export function pickFaceMesh(root) {
  // Prefer meshes that have mouth/jaw morphs && names like Face/Head,
  // && penalize ones that look like Brow/Eye-only meshes.
  const preferredName = /face|head|teeth|mouth/i;
  const badName = /brow|eyebrow|lash|lid/i;

  const mouthKeys = ['Mouth_', 'mouth', 'lip', 'jaw', 'viseme_'];
  const wantedMorphs = [
    ...Object.values(VISEME_MAP.V).flat(),
    ...VISEME_MAP.JawOpen,
    'jawOpen','mouthOpen','mouthClose','mouthSmile','mouthFrown','Mouth_Close',
    'viseme_sil','viseme_aa','viseme_E','viseme_I','viseme_O','viseme_U'
  ];

  let best = { mesh: null, score: -1, nameScore: 0, mouthCount: 0 };

  root.traverse(obj => {
    if (!obj.isMesh || !obj.morphTargetDictionary) return;
    const dict = obj.morphTargetDictionary;
    const names = Object.keys(dict);

    // Count how many of the wanted we actually have (exact hits)
    let score = 0;
    for (const nm of wantedMorphs) if (nm in dict) score++;

    // Extra credit for mouth-related morphs by prefix/substring
    let mouthCount = 0;
    for (const n of names) {
      if (mouthKeys.some(k => n.toLowerCase().includes(k.toLowerCase()))) mouthCount++;
    }
    score += Math.min(mouthCount, 20) * 0.25; // soft bonus

    // Name heuristic
    let nameScore = 0;
    if (preferredName.test(obj.name)) nameScore += 2;
    if (badName.test(obj.name)) nameScore -= 2;

    // Penalize meshes with many Eye/Brow-only morphs && very few mouth morphs
    const eyeLike = names.filter(n => /^(eye|eyelid|eyelash|brow)/i.test(n)).length;
    const nonEyeMouth = names.filter(n => /(mouth|lip|jaw|viseme_)/i.test(n)).length;
    if (eyeLike >= 6 && nonEyeMouth < 3) score -= 4;

    // Final tie-breaker: prefer more total morphs (but lightly)
    score += names.length * 0.01;

    // Combine with nameScore as tie-breaker
    const better = (score > best.score) || (score == best.score && nameScore > best.nameScore);
    if (better) {
      best = { mesh: obj, score, nameScore, mouthCount };
    }
  });

  const chosen = best.mesh;
  if (chosen) {
    console.log(`🎯 pickFaceMesh => "${chosen.name}" (score=${best.score.toFixed(2)}, mouthCount=${best.mouthCount})`);
    debugFace(chosen);
  } else {
    console.warn('⚠️ pickFaceMesh: nenhuma malha facial encontrada; usa primeira com morphs como fallback.');
  }
  return chosen;
}


// Debug aprimorado da malha facial
export function debugFace(mesh) {
  if (!mesh?.morphTargetDictionary) {
    console.log('❌ Nenhuma malha com morph targets encontrada');
    return;
  }

  const dict = mesh.morphTargetDictionary;
  const morphNames = Object.keys(dict);

  console.log(`\n🎭 Malha facial encontrada: "${mesh.name}"`);
  console.log(`📊 Total de morph targets: ${morphNames.length}`);

  // Categorizar morphs
  const categories = {
    visemes: morphNames.filter(n => /^(V_|viseme_)/i.test(n)),
    mouth: morphNames.filter(n => /^(mouth|lip)/i.test(n)),
    jaw: morphNames.filter(n => /^(jaw)/i.test(n)),
    tongue: morphNames.filter(n => /^(tongue)/i.test(n)),
    eyes: morphNames.filter(n => /^(eye|blink)/i.test(n)),
    brows: morphNames.filter(n => /^(brow|eyebrow)/i.test(n)),
    other: morphNames.filter(n => !/^(V_|viseme_|mouth|lip|jaw|tongue|eye|blink|brow)/i.test(n))
  };

  for (const [category, morphs] of Object.entries(categories)) {
    if (morphs.length > 0) {
      console.log(`\n${category.toUpperCase()}:`);
      morphs.forEach(name => console.log(`  • ${name}`));
    }
  }

  // Verificar compatibilidade com o sistema de lipsync
  const compatibleVisemes = Object.values(VISEME_MAP.V).flat()
    .filter(viseme => viseme in dict);

  console.log(`\n✅ Visemas compatíveis encontrados: ${compatibleVisemes.length}`);
  if (compatibleVisemes.length > 0) {
    console.log('Compatible visemes:', compatibleVisemes.join(', '));
  }
}

// Aplicar visema com intensidade e suavização aprimoradas
export function applyViseme(mesh, visemeCode, intensity = 1.0, jawBone = null) {
  if (!mesh) return;

  // Reset suave ao invés de abrupto
  const currentValues = {};
  if (mesh.morphTargetDictionary) {
    Object.keys(mesh.morphTargetDictionary).forEach(name => {
      if (/^(V_|viseme_|mouth)/i.test(name)) {
        currentValues[name] = mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]] || 0;
      }
    });
  }

  // Aplicar reset gradual
  Object.keys(currentValues).forEach(name => {
    const currentValue = currentValues[name];
    const newValue = currentValue * 0.7; // Decaimento suave
    safeSetMorph(mesh, name, newValue);
  });

  // Aplicar novo visema
  const baseIntensity = VISEME_INTENSITY[visemeCode] || 0.5;
  const finalIntensity = baseIntensity * intensity;

  let applied;

  // Mapear visema para morph targets
  switch (visemeCode) {
    case 'aa':
      applied = setAny(mesh, VISEME_MAP.V.Open, finalIntensity);
      break;
    case 'E':
      applied = setAny(mesh, VISEME_MAP.V.Wide, finalIntensity * 0.7);
      break;
    case 'I':
      applied = setAny(mesh, VISEME_MAP.V.Wide, finalIntensity);
      break;
    case 'O':
      applied = setAny(mesh, VISEME_MAP.V.TightO, finalIntensity);
      break;
    case 'U':
      applied = setAny(mesh, VISEME_MAP.V.Tight, finalIntensity);
      break;
    case 'PP':
      applied = setAny(mesh, VISEME_MAP.V.Explosive, finalIntensity);
      break;
    case 'SS':
      applied = setAny(mesh, VISEME_MAP.V.Affricate, finalIntensity);
      break;
    case 'TH':
      applied = setAny(mesh, VISEME_MAP.V.TongueOut, finalIntensity);
      break;
    case 'DD':
      applied = setAny(mesh, VISEME_MAP.V.Affricate, finalIntensity * 0.8);
      break;
    case 'FF':
      applied = setAny(mesh, VISEME_MAP.V.DentalLip, finalIntensity);
      break;
    case 'kk':
      applied = setAny(mesh, VISEME_MAP.V.TongueRaise, finalIntensity);
      break;
    case 'nn':
      applied = setAny(mesh, VISEME_MAP.V.TongueUp, finalIntensity);
      break;
    case 'RR':
      applied = setAny(mesh, VISEME_MAP.V.RR, finalIntensity);
      break;
    case 'CH':
      applied = setAny(mesh, VISEME_MAP.V.CH, finalIntensity);
      break;
    case 'sil':
    default:
      applied = setAny(mesh, VISEME_MAP.V.None, 0);
      break;
  }

  // Fallback genérico se não encontrou morphs específicos
  if (!applied) {
    let any = false;
    const jawOpenAmount = (JAW_OPENING[visemeCode] || 0) * intensity;

    // Abrir a boca genérico (funciona em muitos avatares)
    any = safeSetMorph(mesh, 'jawOpen', jawOpenAmount) || any; // alias cobre MouthOpen/mouthOpen

    // Largura (E/I/aa): usar stretch/smile
    if (visemeCode === 'E' || visemeCode === 'I' || visemeCode === 'aa') {
      const w = finalIntensity * (visemeCode === 'aa' ? 0.6 : 0.8);
      any = safeSetMorph(mesh, 'mouthStretchLeft',  w) || any;
      any = safeSetMorph(mesh, 'mouthStretchRight', w) || any;
      any = safeSetMorph(mesh, 'mouthSmileLeft',    w * 0.6) || any;
      any = safeSetMorph(mesh, 'mouthSmileRight',   w * 0.6) || any;
    }

    // Arredondamento (O/U)
    if (visemeCode === 'O' || visemeCode === 'U') {
      any = safeSetMorph(mesh, 'mouthPucker', finalIntensity * 0.9) || any;
      any = safeSetMorph(mesh, 'mouthFunnel', finalIntensity * 0.7) || any;
    }

    // Bilabial (PP) fecha mais
    if (visemeCode === 'PP') {
      any = safeSetMorph(mesh, 'mouthClose', Math.min(1, 0.85 * intensity)) || any;
      any = safeSetMorph(mesh, 'mouthPressLeft',  Math.min(1, 0.7 * intensity)) || any;
      any = safeSetMorph(mesh, 'mouthPressRight', Math.min(1, 0.7 * intensity)) || any;
    }

    // Fricativas leves (SS/FF/TH) mantém pequena abertura
    if (visemeCode === 'SS' || visemeCode === 'FF' || visemeCode === 'TH') {
      any = safeSetMorph(mesh, 'jawOpen', Math.max(jawOpenAmount, 0.1 * intensity)) || any;
    }

    // Rótico (RR): leve arredondamento sem fechar
    if (visemeCode === 'RR') {
      any = safeSetMorph(mesh, 'mouthFunnel', finalIntensity * 0.4) || any;
    }

    applied = any;
  }

  // Aplicar movimento da mandíbula se disponível
  if (jawBone && JAW_OPENING[visemeCode] !== undefined) {
    const jawRotation = JAW_OPENING[visemeCode] * intensity * 0.2; // Limite máximo de rotação (reduzido)
    jawBone.rotation.x = jawRotation;
  }

  return applied;
}

// Reset parcial
// Função para transição suave entre visemas
export function blendToViseme(mesh, fromViseme, toViseme, progress, intensity = 1.0, jawBone = null) {
  if (!mesh || progress < 0 || progress > 1) return;

  // Aplicar blend entre os dois visemas
  const fromIntensity = (VISEME_INTENSITY[fromViseme] || 0.5) * (1 - progress) * intensity;
  const toIntensity = (VISEME_INTENSITY[toViseme] || 0.5) * progress * intensity;

  // Reset parcial
  resetMouth(mesh);

  // Aplicar visemas com intensidades blendadas
  if (fromIntensity > 0.01) {
    applyViseme(mesh, fromViseme, fromIntensity, null);
  }
  if (toIntensity > 0.01) {
    applyViseme(mesh, toViseme, toIntensity, null);
  }

  // Blend da mandíbula
  if (jawBone) {
    const fromJaw = JAW_OPENING[fromViseme] || 0;
    const toJaw = JAW_OPENING[toViseme] || 0;
    const blendedJaw = (fromJaw * (1 - progress) + toJaw * progress) * intensity * 0.2; // reduzido
    jawBone.rotation.x = blendedJaw;
  }
}

// Exportar constantes e funções para uso externo
export { VISEME_MAP, VISEME_INTENSITY, JAW_OPENING };
