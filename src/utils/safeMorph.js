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

  jawOpen: ['jawOpen','JawOpen','MouthOpen','mouthOpen'],
  mouthClose: ['mouthClose','MouthClose','lipsTogether','LipsClose'],
  mouthPressLeft:  ['mouthPressLeft','MouthPress_L','lipsPress_L'],
  mouthPressRight: ['mouthPressRight','MouthPress_R','lipsPress_R'],
  mouthSmileLeft:  ['mouthSmileLeft','Smile_L','MouthSmile_L'],
  mouthSmileRight: ['mouthSmileRight','Smile_R','MouthSmile_R'],
  mouthFrownLeft:  ['mouthFrownLeft','Frown_L','MouthFrown_L'],
  mouthFrownRight: ['mouthFrownRight','Frown_R','MouthFrown_R'],
  cheekPuff: ['cheekPuff','CheekPuff','Puff'],
  cheekSquintLeft: ['cheekSquintLeft','CheekSquint_L'],
  cheekSquintRight:['cheekSquintRight','CheekSquint_R'],
  noseSneerLeft:   ['noseSneerLeft','NoseSneer_L'],
  noseSneerRight:  ['noseSneerRight','NoseSneer_R'],
};

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

export function safeSetMorph(mesh, morphName, value) {
  if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return false;
  const real = resolveMorphName(mesh.morphTargetDictionary, morphName);
  if (!real) return false;
  const idx = mesh.morphTargetDictionary[real];
  if (typeof idx !== 'number') return false;
  const v = Math.max(0, Math.min(1, value));
  mesh.morphTargetInfluences[idx] = v;
  if (mesh.material && 'needsUpdate' in mesh.material) {
    mesh.material.needsUpdate = mesh.material.needsUpdate || false;
  }
  return true;
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
