// utils/skeletonMap.js
export const HIPS_ALIASES = [
  'CC_Base_Hip','Hips','mixamorig:Hips','Armature/Hips','Pelvis','root','Root'
];

// === Mapa principal (prioriza EXACTAMENTE os teus nomes CC_Base_…)
export const BONE_ALIASES = {
  Hips: HIPS_ALIASES,

  // Coluna / Cabeça
  Spine:  ['CC_Base_Spine01','Spine','mixamorig:Spine'],
  Spine1: ['CC_Base_Spine02','Spine1','mixamorig:Spine1'],
  Spine2: ['CC_Base_Spine03','CC_Base_Spine02','Spine2','mixamorig:Spine2'], // tenta 03, cai p/ 02
  Neck:   ['CC_Base_NeckTwist01','Neck','mixamorig:Neck'],
  Head:   ['CC_Base_Head','Head','mixamorig:Head'],

  // Ombros / Braços
  LeftShoulder:  ['CC_Base_L_Clavicle','LeftShoulder','mixamorig:LeftShoulder'],
  RightShoulder: ['CC_Base_R_Clavicle','RightShoulder','mixamorig:RightShoulder'],
  LeftArm:       ['CC_Base_L_Upperarm','LeftArm','mixamorig:LeftArm'],
  RightArm:      ['CC_Base_R_Upperarm','RightArm','mixamorig:RightArm'],
  LeftForeArm:   ['CC_Base_L_Forearm','LeftForeArm','mixamorig:LeftForeArm'],
  RightForeArm:  ['CC_Base_R_Forearm','RightForeArm','mixamorig:RightForeArm'],
  LeftHand:      ['CC_Base_L_Hand','LeftHand','mixamorig:LeftHand'],
  RightHand:     ['CC_Base_R_Hand','RightHand','mixamorig:RightHand'],

  // Pernas/Pés (se quiseres poses de pernas)
  LeftUpLeg:  ['CC_Base_L_Thigh','LeftUpLeg','mixamorig:LeftUpLeg'],
  RightUpLeg: ['CC_Base_R_Thigh','RightUpLeg','mixamorig:RightUpLeg'],
  LeftLeg:    ['CC_Base_L_Calf','LeftLeg','mixamorig:LeftLeg'],
  RightLeg:   ['CC_Base_R_Calf','RightLeg','mixamorig:RightLeg'],
  LeftFoot:   ['CC_Base_L_Foot','LeftFoot','mixamorig:LeftFoot'],
  RightFoot:  ['CC_Base_R_Foot','RightFoot','mixamorig:RightFoot'],
  LeftToeBase:['CC_Base_L_ToeBase','LeftToeBase'],
  RightToeBase:['CC_Base_R_ToeBase','RightToeBase'],

  // Olhos (não aparecem no boneMap, mas existem no GLB)
  LeftEye:  ['CC_Base_L_Eye','LeftEye','eye_L'],
  RightEye: ['CC_Base_R_Eye','RightEye','eye_R'],
};

export function findNodeByAliases(root, aliases) {
  if (!root || !aliases) return null;
  let found = null;
  root.traverse(o => {
    if (found) return;
    const n = o.name || '';
    if (aliases.includes(n)) found = o;
  });
  if (found) return found;
  // fallback contains
  root.traverse(o => {
    if (found) return;
    const n = (o.name || '').toLowerCase();
    if (aliases.some(a => n.includes(a.toLowerCase()))) found = o;
  });
  return found;
}

export function getBones(root, keys = Object.keys(BONE_ALIASES)) {
  const out = {};
  for (const k of keys) out[k] = findNodeByAliases(root, BONE_ALIASES[k]);
  return out;
}

// útil p/ debug
export function logMissingBones(root, keys = ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand']) {
  const b = getBones(root, keys);
  const missing = keys.filter(k => !b[k]);
  if (missing.length) console.warn('[bones] missing:', missing.join(', '));
  return missing;
}
