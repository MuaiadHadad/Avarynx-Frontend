// utils/safeMorph.js
const MORPH_ALIASES = {
  eyeBlinkLeft:  [
    'eyeBlinkLeft','BlinkLeft','blink_L','EyelidClose_L','EyeBlink_L',
    'Eye_Blink_L',
    'Eyelid_Inner_Down_L','Eyelid_Outer_Down_L', // fallbacks (pálpebras)
    'Eyelash_Upper_Down_L','Eyelash_Lower_Up_L'  // extra fallback
  ],
  eyeBlinkRight: [
    'eyeBlinkRight','BlinkRight','blink_R','EyelidClose_R','EyeBlink_R',
    'Eye_Blink_R',
    'Eyelid_Inner_Down_R','Eyelid_Outer_Down_R',
    'Eyelash_Upper_Down_R','Eyelash_Lower_Up_R'
  ],

  eyeLookUpLeft:    ['eyeLookUpLeft','lookUp_L','EyeUp_L'],
  eyeLookUpRight:   ['eyeLookUpRight','lookUp_R','EyeUp_R'],
  eyeLookDownLeft:  ['eyeLookDownLeft','lookDown_L','EyeDown_L'],
  eyeLookDownRight: ['eyeLookDownRight','lookDown_R','EyeDown_R'],

  eyeLookLeft:  ['eyeLookLeft','look_L','EyeLeft'],
  eyeLookRight: ['eyeLookRight','look_R','EyeRight'],

  eyeLookInLeft:  ['eyeLookInLeft','lookIn_L','EyeIn_L'],
  eyeLookInRight: ['eyeLookInRight','lookIn_R','EyeIn_R'],
  eyeLookOutLeft: ['eyeLookOutLeft','lookOut_L','EyeOut_L'],
  eyeLookOutRight:['eyeLookOutRight','lookOut_R','EyeOut_R'],

  eyesClosed: ['eyesClosed','bothEyesClosed','EyeClose','EyesClosed'],

  browInnerUp: ['browInnerUp','BrowsUpCenter','InnerBrowUp','BrowInnerUp'],
  browDownLeft: ['browDownLeft','BrowsDownLeft','BrowDown_L'],
  browDownRight:['browDownRight','BrowsDownRight','BrowDown_R'],
  browOuterUpLeft: ['browOuterUpLeft','BrowsUpLeft','BrowUp_L'],
  browOuterUpRight:['browOuterUpRight','BrowsUpRight','BrowUp_R'],

  eyeSquintLeft:  ['eyeSquintLeft','EyeSquint_L','squint_L'],
  eyeSquintRight: ['eyeSquintRight','EyeSquint_R','squint_R'],
  eyeWideLeft:    ['eyeWideLeft','EyeWide_L','wide_L'],
  eyeWideRight:   ['eyeWideRight','EyeWide_R','wide_R'],

  jawOpen: [
    'jawOpen','JawOpen','CC_Base_JawOpen','CC_Base_Jaw','V_Open',
    'Mouth_Open','mouthOpen','Open_Mouth','MouthOpen'
  ],

  // Fechar/pressionar
  mouthClose: [
    'mouthClose','Mouth_Close','MouthClose','Close_Mouth'
  ],
  mouthPressLeft: [
    'mouthPressLeft','Mouth_Press_L','Press_L','MouthPress_L','mouthCloseLeft'
  ],
  mouthPressRight: [
    'mouthPressRight','Mouth_Press_R','Press_R','MouthPress_R','mouthCloseRight'
  ],

  // Largura / stretch
  mouthWide: [
    'mouthWide','Mouth_Wide','Mouth_Stretch','Mouth_Stretch_LR'
  ],
  mouthStretchLeft: [
    'mouthStretchLeft','Mouth_Stretch_L','StretchLeft','mouthWideLeft'
  ],
  mouthStretchRight: [
    'mouthStretchRight','Mouth_Stretch_R','StretchRight','mouthWideRight'
  ],

  // Sorriso
  mouthSmileLeft: [
    'mouthSmileLeft','Mouth_Smile_L','SmileLeft','smile_L'
  ],
  mouthSmileRight: [
    'mouthSmileRight','Mouth_Smile_R','SmileRight','smile_R'
  ],

  // Arredondar / funil (pucker/funnel)
  mouthPucker: [
    'mouthPucker','Mouth_Pucker','Pucker','Mouth_Pucker_C'
  ],
  mouthFunnel: [
    'mouthFunnel','Mouth_Funnel','Funnel','Mouth_Funnel_C'
  ],
  // laterais
  mouthPuckerLeft: [
    'mouthPuckerLeft','Mouth_Pucker_Up_L','Mouth_Pucker_Down_L','Mouth_Funnel_Up_L','Mouth_Funnel_Down_L'
  ],
  mouthPuckerRight: [
    'mouthPuckerRight','Mouth_Pucker_Up_R','Mouth_Pucker_Down_R','Mouth_Funnel_Up_R','Mouth_Funnel_Down_R'
  ],
  mouthFunnelLeft: [
    'mouthFunnelLeft','Mouth_Funnel_Up_L','Mouth_Funnel_Down_L','Mouth_Pucker_Up_L','Mouth_Pucker_Down_L'
  ],
  mouthFunnelRight: [
    'mouthFunnelRight','Mouth_Funnel_Up_R','Mouth_Funnel_Down_R','Mouth_Pucker_Up_R','Mouth_Pucker_Down_R'
  ],

  // Língua (caso uses)
  tongueOut: ['tongueOut','Tongue_Out','V_Tongue_Out'],
  tongueUp:  ['tongueUp','Tongue_Up','V_Tongue_up','V_Tongue_Up','V_Tongue_Raise'],
};

// ---------- util interno: tenta aplicar por vários nomes ----------
function _applyByName(mesh, name, value) {
  const dict = mesh.morphTargetDictionary;
  const infl = mesh.morphTargetInfluences;

  // 1) match direto
  if (Object.prototype.hasOwnProperty.call(dict, name)) {
    infl[dict[name]] = Math.max(0, Math.min(1, value));
    mesh.needsUpdate = true;
    return true;
  }
  // 2) case-insensitive
  const lower = name.toLowerCase();
  const ks = Object.keys(dict);
  const k2 = ks.find(k => k.toLowerCase() === lower);
  if (k2) {
    infl[dict[k2]] = Math.max(0, Math.min(1, value));
    mesh.needsUpdate = true;
    return true;
  }
  return false;
}

// ---------- API PRINCIPAL ----------
export function safeSetMorph(mesh, name, value) {
  if (!mesh || !mesh.morphTargetDictionary) return false;

  // tenta o nome pedido
  if (_applyByName(mesh, name, value)) return true;

  // tenta aliases conhecidos
  const alts = MORPH_ALIASES[name];
  if (alts && Array.isArray(alts)) {
    for (const alt of alts) {
      if (_applyByName(mesh, alt, value)) return true;
    }
  }

  // heurística leve: se pediste ...Left e não existe, tenta trocar por Right (e vice-versa)
  if (/left$/i.test(name)) {
    const guess = name.replace(/left$/i, 'Right');
    if (_applyByName(mesh, guess, value)) return true;
  } else if (/right$/i.test(name)) {
    const guess = name.replace(/right$/i, 'Left');
    if (_applyByName(mesh, guess, value)) return true;
  }

  return false;
}

function resolveMorphName(dict, wanted) {
  if (!dict) return null;
  if (wanted in dict) return wanted;
  const aliases = MORPH_ALIASES[wanted] || [wanted];
  for (const a of aliases) if (a in dict) return a;
  // fuzzy
  const keys = Object.keys(dict);
  const needle = wanted.toLowerCase();

  const hit = keys.find(k => {
    const kk = k.toLowerCase();

    // se estamos a pedir algo de olho, só aceita Eye*/Eyelid*/Eyelash*
    if (needle.startsWith('eye')) {
      if (!/^(eye|eyelid|eyelash)/i.test(k)) return false;
    }
    // idem se um dia pedires "mouth*/jaw*/lip*" poderias restringir aqui

    return kk.includes(needle);
  });
  return hit || null;
}

export function findFirstMeshWithMorph(root, ...morphNames) {
  if (!root) return null;

  const visit = (node, cb) => {
    if (!node) return;
    if (Array.isArray(node)) { for (const n of node) visit(n, cb); return; }
    if (typeof node.traverse === 'function') node.traverse(cb);
    else cb(node);
  };

  let found = null;
  visit(root, (o) => {
    if (found) return;
    if (!o.isMesh || !o.morphTargetDictionary) return;
    for (const m of morphNames) {
      const real = resolveMorphName(o.morphTargetDictionary, m);
      if (real) { found = o; break; }
    }
  });
  return found;
}
