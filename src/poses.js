// src/poses.js
import { findNodeByAliases, HIPS_ALIASES, BONE_ALIASES, isCCRig } from './utils/skeletonMap.js'

// normaliza nomes
const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'')
function getNode(root, name) {
  const target = norm(name); let res=null
  root.traverse(o=>{ if(!res && norm(o.name)===target) res=o })
  if (!res) root.traverse(o=>{ if(!res && norm(o.name).includes(target)) res=o })
  return res
}
function getByAliasOrName(root, name){
  if (BONE_ALIASES[name]) {
    const n = findNodeByAliases(root, BONE_ALIASES[name])
    if (n) return n
  }
  if (/^hips$/i.test(name)) {
    const n = findNodeByAliases(root, HIPS_ALIASES)
    if (n) return n
  }
  return getNode(root, name)
}
function setVec3(obj, key, v) {
  if (!obj) return
  const x = v.x||0, y = v.y||0, z = v.z||0
  if (key==='position') obj.position.set(x,y,z)
  if (key==='rotation') obj.rotation.set(x,y,z)
  if (key==='scale')    obj.scale.set(x||1,y||1,z||1)
}
function applyProps(root, props) {
  for (const path in props) {
    const [nodeName, key] = path.split('.')
    const node = getByAliasOrName(root, nodeName)
    setVec3(node, key, props[path])
  }
}

export const poseTemplates = {
  neutral: { standing: true, props: {} },

  // Idle mãos em baixo (Mixamo default: usa eixo Z p/ descer braços)
  idle_hands_down: {
    standing: true,
    props: {
      // alinhamento geral
      'Hips.rotation':   { x: 0.0,   y: 0.0,   z: 0.0 },
      'Spine.rotation':  { x: 0.03,  y: 0.00,  z: 0.00 },
      'Spine1.rotation': { x: 0.02,  y: 0.00,  z: 0.00 },
      'Spine2.rotation': { x: 0.01,  y: 0.00,  z: 0.00 },
      'Neck.rotation':   { x: 0.00,  y: 0.00,  z: 0.00 },
      'Head.rotation':   { x: 0.00,  y: 0.00,  z: 0.00 },

      'LeftShoulder.rotation':  { x: 0.00, y: 0.00,  z: -0.12 },
      'RightShoulder.rotation': { x: 0.00, y: 0.00,  z:  0.12 },

      // *** CC rig: baixar braço é em X negativo (~77°–82°) ***
      'LeftArm.rotation':       { x: -1.35, y:  0.05, z: 0.05 },
      'RightArm.rotation':      { x: -1.35, y: -0.05, z: -0.05 },

      // cotovelos ligeiramente fletidos
      'LeftForeArm.rotation':   { x: -0.25, y: 0.02, z: 0.00 },
      'RightForeArm.rotation':  { x: -0.25, y: -0.02, z: 0.00 },

      'LeftHand.rotation':      { x: 0.00, y: 0.00, z: 0.10 },
      'RightHand.rotation':     { x: 0.00, y: 0.00, z: -0.10 },
    },
  },

  side: {
    standing: true,
    props: {
      'Hips.position': {x:0, y:1, z:0},
      'Hips.rotation': {x:-0.003, y:-0.017, z:0.1},
      'Spine.rotation': {x:-0.103, y:-0.002, z:-0.063},
      'Spine1.rotation': {x:0.042, y:-0.02, z:-0.069},
      'Spine2.rotation': {x:0.131, y:-0.012, z:-0.065},
      'Neck.rotation': {x:0.027, y:0.006, z:0},
      'Head.rotation': {x:0.077, y:-0.065, z:0},
      'LeftShoulder.rotation': {x:1.599, y:0.084, z:-1.77},
      'LeftArm.rotation': {x:1.364, y:0.052, z:-0.044},
      'LeftForeArm.rotation': {x:0.002, y:-0.007, z:-0.062},
      'RightShoulder.rotation': {x:-0.55, y:-0.05, z:0.5},
      'RightArm.rotation': {x:-0.2, y:0.1, z:0.1},
      'RightForeArm.rotation': {x:-0.05, y:0.02, z:-0.02},
    },
  },
  camera: {
    standing: true,
    props: {
      'Hips.position': {x:0, y:1, z:0},
      'Hips.rotation': {x:0, y:0, z:0},
      'Spine.rotation': {x:0.05, y:0, z:0},
      'Neck.rotation': {x:-0.02, y:0, z:0},
      'Head.rotation': {x:-0.03, y:0.03, z:0},
    },
  },
}

// aplica a pose; se for CC rig, ajusta eixo dos braços para X (em vez de Z)
export function applyPoseTemplate(root, name) {
  const tpl = poseTemplates[name] || poseTemplates.neutral
  const props = { ...tpl.props }

  if (name === 'idle_hands_down' && isCCRig(root)) {
    // nos CC rigs, “braço para baixo” é em X negativo
    props['LeftArm.rotation']  = { x: -1.35, y: 0.05,  z: 0.05 }
    props['RightArm.rotation'] = { x: -1.35, y: -0.05, z: -0.05 }
  }

  applyProps(root, props)
}
