// main.js — Avarinx Avatar (olhos + lipsync) com CÂMERA FIXA “portrait” + RIG NEON

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { getBones, logMissingBones } from './utils/skeletonMap.js'
import { AvatarAnimator } from './utils/animator.js'
import { AdvancedLipsyncSystem } from './utils/advancedLipsync.js'
import { pickFaceMesh, debugFace, applyViseme, resetMouth } from './utils/lipsyncMap.js'

import { resumeAudioContext } from './utils/audio.js'
import { AudioVisemeDetector } from './utils/audioViseme.js'
import { safeSetMorph, findFirstMeshWithMorph } from './utils/safeMorph.js'

// ---------------- DOM ----------------
const canvas = document.getElementById('canvas')
const logEl  = document.getElementById('log')
const btnResumeAudio = document.getElementById('btnResumeAudio')
const inputUrl = document.getElementById('avatarUrl')
const btnLoad  = document.getElementById('btnLoad')
const inputFile = document.getElementById('fileInput')
const selPose  = document.getElementById('poseTemplate')
const eyeUD = document.getElementById('eyeUD')
const eyeLR = document.getElementById('eyeLR')
const blink = document.getElementById('blink')
const txt = document.getElementById('ttsText')
const btnSpeak = document.getElementById('btnSpeak')

// ---------------- STATE ----------------
const state = {
  model: null,
  skinnedMeshes: [],
  morphMeshes: [],
  eyes: { left: null, right: null },
  animator: null,
  lipsync: null,
  lipsyncSystem: null,
  faceMesh: null,
  jawBone: null,
  audioDet: null,
  micStream: null,
}

// ---------------- Utils ----------------
function log(msg){
  console.log(msg)
  if (logEl) logEl.textContent = String(msg) + '\n' + (logEl.textContent || '')
}

// ---------------- Scene / Renderer ----------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15         // ajusta 1.0–1.6 ao gosto
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
{
  const p = canvas.parentElement
  const w = p?.clientWidth  || window.innerWidth
  const h = p?.clientHeight || window.innerHeight
  renderer.setSize(w, h)
}

const scene = new THREE.Scene()
scene.background = new THREE.Color('#18133b')

// camera/controls
const parent = canvas.parentElement
const camera = new THREE.PerspectiveCamera(
  30, // FOV mais fechado para retrato
  (parent?.clientWidth || window.innerWidth) / (parent?.clientHeight || window.innerHeight),
  0.1, 100
)
const controls = new OrbitControls(camera, canvas)
controls.enablePan = false
controls.enableZoom = false
controls.enableRotate = false // câmara fixa
controls.update()

// --- Neon / Cyber rig (key magenta, fill ciano, rim azul) ---
const neon = addNeonRig(scene)

// Luz ambiente muito leve para não matar contraste
const amb = new THREE.AmbientLight(0x111214, 0.35)
scene.add(amb)

function addNeonRig(scene) {
  // Key: magenta do lado direito (do avatar)
  const key = new THREE.SpotLight(0xff2fa6, 50, 50, Math.PI/6, 0.35, 2)
  key.position.set(3.0, 6.0, 0.9)
  key.castShadow = false
  key.shadow.mapSize.set(1024, 1024)
  key.target.position.set(0, 1.55, 0)
  scene.add(key, key.target)

  // Fill: ciano do lado esquerdo
  const fill = new THREE.SpotLight(0x35d7ff, 20, 10, Math.PI/4, 0.25, 2)
  fill.position.set(-2.0, 1.55, 0.9)
  fill.castShadow = false
  fill.target.position.set(0, 1.50, 0)
  scene.add(fill, fill.target)

  // Rim/contra-luz: azul atrás
  const rim = new THREE.DirectionalLight(0x7bb1ff, 1.0)
  rim.position.set(-1.1, 1.4, -1.2)
  rim.castShadow = false
  scene.add(rim)

  const front = new THREE.SpotLight(0xffffff, 5, 90, Math.PI/6, 0.25, 2)
  front.position.set(0, 1.55, 1.2)          // à frente e um pouco acima
  front.castShadow = false
  front.shadow.mapSize.set(1024, 1024)
  front.target.position.set(0, 1.55, 0)     // aponta para a cara
  scene.add(front, front.target)

  return { key, fill, rim }
}

const loader = new GLTFLoader()

// ---------------- Config ----------------
async function loadConfig() {
  try {
    const res = await fetch('/siteconfig.json')
    return await res.json()
  } catch {
    log('Failed to load siteconfig.json, using defaults')
    return { avatarUrl: '/assets/avatars/brunette_1.glb', poseTemplate: 'neutral' }
  }
}

// ---------------- Load utils ----------------
async function loadAvatar(url, fileBlob) {
  return new Promise((resolve, reject) => {
    const onLoad = (gltf) => resolve(gltf)
    const onErr = (e) => reject(e)
    if (fileBlob) {
      const reader = new FileReader()
      reader.onload = () => loader.parse(reader.result, '', onLoad, onErr)
      reader.readAsArrayBuffer(fileBlob)
    } else {
      loader.load(url, onLoad, undefined, onErr)
    }
  })
}

function clearModel() {
  if (state.model) {
    scene.remove(state.model)
    state.model.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.())
        else obj.material.dispose?.()
      }
    })
  }
  state.model = null
  state.skinnedMeshes = []
  state.morphMeshes = []
  state.eyes = { left: null, right: null }
  state.animator = null
  state.lipsync = null
  state.faceMesh = null
  state.jawBone = null
}

function indexModel(root) {
  const skinned = []
  const morphs = []
  root.traverse(obj => {
    if (obj.isSkinnedMesh) skinned.push(obj)
    if (obj.isMesh && obj.morphTargetDictionary) morphs.push(obj)
  })
  state.skinnedMeshes = skinned
  state.morphMeshes  = morphs

  // tentar olhos por nome
  let left=null, right=null
  root.traverse(o=>{
    const n = o.name||''
    if (!left  && /left.*eye|eye.*left|eye_l/i.test(n))  left=o
    if (!right && /right.*eye|eye.*right|eye_r/i.test(n)) right=o
  })
  state.eyes.left  = left
  state.eyes.right = right
}

function setE(b, x, y, z) {
  if (!b) return
  b.rotation.order = 'XYZ'
  b.rotation.set(x, y, z)
}

function applyPoseTemplate(root /*, name */) {
  // braços para baixo simples
  const bones = getBones(root)
  const r = THREE.MathUtils.degToRad
  if (bones.LeftShoulder)  setE(bones.LeftShoulder,  0, 0,  r(-110))
  if (bones.RightShoulder) setE(bones.RightShoulder, 0, 0,   r(110))
  if (bones.LeftArm)       setE(bones.LeftArm,       r(-5),  r(8),  r(-50))
  if (bones.RightArm)      setE(bones.RightArm,      r(-5),  r(-8), r(50))
  if (bones.LeftForeArm)   setE(bones.LeftForeArm,   r(-12), 0, 0)
  if (bones.RightForeArm)  setE(bones.RightForeArm,  r(-12), 0, 0)
}

// ---------- framing da CÂMERA (retrato) ----------
function framePortrait(root) {
  if (!root) return
  root.updateMatrixWorld(true)
  const bones = getBones(root)

  // tenta “Head” e “Spine2/Neck” para definir a faixa do retrato
  const pHead = new THREE.Vector3()
  const pChest = new THREE.Vector3()
  let okHead = false, okChest = false
  if (bones.Head)  { bones.Head.getWorldPosition(pHead); okHead = true }
  if (bones.Spine2 || bones.Neck || bones.Spine1) {
    (bones.Spine2 || bones.Neck || bones.Spine1).getWorldPosition(pChest); okChest = true
  }

  let viewTopY, viewBottomY
  if (okHead && okChest) {
    viewTopY = pHead.y + 0.06          // ligeiro espaço acima do crânio
    viewBottomY = pChest.y - 0.10      // um pouco abaixo do peito
  } else {
    const box = new THREE.Box3().setFromObject(root)
    viewTopY = box.max.y - box.getSize(new THREE.Vector3()).y * 0.15
    viewBottomY = box.min.y + box.getSize(new THREE.Vector3()).y * 0.35
  }

  const viewHeight = Math.max(0.35, viewTopY - viewBottomY)
  const centerY = (viewTopY + viewBottomY) * 0.55

  // calcula a distância pela altura visível e FOV
  const fov = 30
  camera.fov = fov
  camera.updateProjectionMatrix()
  const dist = (viewHeight / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2))

  // posiciona a câmara em frente, centrada na cabeça/peito
  const target = new THREE.Vector3(0, centerY, 0)
  camera.position.set(0, centerY, dist * 1.03)
  controls.target.copy(target)
  controls.update()

  // vira as luzes para o alvo (garante que “olham” para a cara)
  neon.key.target.position.copy(target)
  neon.fill.target.position.copy(target)
  neon.key.target.updateMatrixWorld()
  neon.fill.target.updateMatrixWorld()
}

// ---------------- Eyes: blink (cache + aliases) ----------------
state.blinkMeshes = { L:null, R:null, C:null } // cache

function resolveBlinkMeshes(){
  // tenta várias nomenclaturas (safeSetMorph resolve aliases)
  state.blinkMeshes.L = state.blinkMeshes.L || findFirstMeshWithMorph(
    state.model,
    'eyeBlinkLeft','BlinkLeft','blink_L','EyelidClose_L','EyeBlink_L'
  )
  state.blinkMeshes.R = state.blinkMeshes.R || findFirstMeshWithMorph(
    state.model,
    'eyeBlinkRight','BlinkRight','blink_R','EyelidClose_R','EyeBlink_R'
  )
  // fallback “ambos os olhos”
  state.blinkMeshes.C = state.blinkMeshes.C || findFirstMeshWithMorph(
    state.model,
    'eyesClosed','bothEyesClosed','EyeClose'
  )
  console.log('[BLINK] found L/R/C =',
    !!state.blinkMeshes.L, !!state.blinkMeshes.R, !!state.blinkMeshes.C)
}

// aplica o valor de blink 0..1
function animateBlink(val) {
  if (!state.model) return

  // força os morphs certos — nada de brow aqui
  const applyNamesL = [
    'Eye_Blink_L',           // pálpebra principal (teu GLB tem)
    'Eyelid_Inner_Down_L',
    'Eyelid_Outer_Down_L',
    'Eyelash_Upper_Down_L',
    'Eyelash_Lower_Up_L'
  ]
  const applyNamesR = [
    'Eye_Blink_R',
    'Eyelid_Inner_Down_R',
    'Eyelid_Outer_Down_R',
    'Eyelash_Upper_Down_R',
    'Eyelash_Lower_Up_R'
  ]

  // opcional: garantimos que não há “up” a contrariar
  const zeroOppL = ['Eyelash_Upper_Up_L','Eyelash_Lower_Down_L']
  const zeroOppR = ['Eyelash_Upper_Up_R','Eyelash_Lower_Down_R']

  // percorre TODAS as malhas com morphs e aplica
  for (const mesh of state.morphMeshes || []) {
    // esquerdo
    for (const n of applyNamesL) safeSetMorph(mesh, n, val)
    for (const n of zeroOppL)   safeSetMorph(mesh, n, 0)
    // direito
    for (const n of applyNamesR) safeSetMorph(mesh, n, val)
    for (const n of zeroOppR)   safeSetMorph(mesh, n, 0)
    // fallback “ambos os olhos” se existir
    //safeSetMorph(mesh, 'EyesClosed', val)
    //safeSetMorph(mesh, 'EyeClose',   val)
  }
}
// --- Blink automático robusto (independente de faceMesh) ---
let __blinkTime = 0
let __blinkActive = false
let __nextBlinkIn = 0

function scheduleNextBlink(){
  // piscar a cada ~2–5 s, com variação
  __nextBlinkIn = 2 + Math.random()*3
}
scheduleNextBlink()

function updateBlink(dt){
  // conta até ao próximo blink
  if (!__blinkActive){
    __nextBlinkIn -= dt
    if (__nextBlinkIn <= 0){
      __blinkActive = true
      __blinkTime = 0 // inicia
    }
  }

  // anima curva de fecho/abertura (~240 ms total)
  if (__blinkActive){
    __blinkTime += dt
    const D = 0.24 // duração total
    const u = Math.min(1, __blinkTime / D)
    const easeInOut = u < 0.5 ? (u*2) : (2 - u*2)  // 0→1→0
    const blinkVal = Math.min(1, Math.max(0, easeInOut*1.15)) // leve “overshoot”

    animateBlink(blinkVal)

    if (__blinkTime >= D){
      __blinkActive = false
      animateBlink(0)
      scheduleNextBlink()
    }
  }
}
// ---------------- Boot / TryLoad ----------------
async function boot() {
  const cfg = await loadConfig()
  inputUrl.value = cfg.avatarUrl || ''
  selPose.value  = cfg.poseTemplate || 'neutral'
  await tryLoad(cfg.avatarUrl)
  tick()
}

async function tryLoad(url, fileBlob) {
  try {
    const gltf = await loadAvatar(url, fileBlob)
    clearModel()
    state.model = gltf.scene
    scene.add(state.model)

    // garantir morphTargets ativos e sombras nos materiais
    state.model.traverse(o=>{
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        if (o.morphTargetInfluences && o.material) {
          o.material.morphTargets = true
          o.material.needsUpdate = true
        }
        if (o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = 0.6
      }
    })

    indexModel(state.model)
    applyPoseTemplate(state.model)
    log('Loaded avatar OK')

    // ----- faceMesh & jaw -----
    const faceMesh = pickFaceMesh(state.model)
    state.faceMesh = faceMesh

    let jawBone = null
    state.model.traverse(o=>{
      if (jawBone) return
      if (
        /(^|:)Jaw(Root)?$/i.test(o.name) ||
        ['CC_Base_Jaw','CC_Base_JawRoot','LowerJaw','mixamorig:Jaw'].includes(o.name)
      ) jawBone = o
    })
    state.jawBone = jawBone
    console.warn('[LIPSYNC] jawBone =', jawBone?.name || '(none)')
    // Use debugFace corretamente (passa a mesh facial se existir)
    debugFace(faceMesh || state.model)
    resolveBlinkMeshes() // prepara as malhas de blink assim que o modelo carrega
    window.blink = (v=1)=>animateBlink(v) // atalho para testares na consola

    // ----- olhos: usa ossos (morphs off) -----
    state.animator = new AvatarAnimator(state.model, { useMorphs: false })

    // ----- lipsync system (avançado) -----
    state.lipsyncSystem = await AdvancedLipsyncSystem.create(state.model, {
      debugMode: false,
      quality: 'high',
      autoDetectMesh: true,
    })
    // usar o player interno para o loop
    state.lipsync = state.lipsyncSystem.player

    // expor para consola
    window.__faceMesh = faceMesh
    window.__jawBone  = jawBone
    state.faceMesh = faceMesh
    state.jawBone = jawBone
    window.resetMouth = () => resetMouth(faceMesh)
    // corrigir ordem: applyViseme(mesh, code, intensity, jawBone)
    window.applyV     = (code='aa', s=1)=> applyViseme(faceMesh, code, s, jawBone)

    if (faceMesh) {
      console.info('[faceMesh]', faceMesh.name)
      console.info(Object.keys(faceMesh.morphTargetDictionary))
    }
    logMissingBones(state.model)

    // —— fixa a câmara no “portrait” assim que o avatar carrega
    framePortrait(state.model)
    resolveBlinkMeshes() // prepara as malhas de blink assim que o modelo carrega
    window.blink = (v=1)=>animateBlink(v) // atalho para testares na consola
  } catch (e) {
    log('ERROR loading avatar: ' + (e?.message || e))
    console.error(e)
  }
}

// Optional: Web Speech API TTS helper (plays audio while lipsync runs)
function speakWithWebSpeech(text, { emotion='neutral', rate, pitch } = {}) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const presets = {
      neutral:   { rate: 1.0, pitch: 1.0 },
      happy:     { rate: 1.1, pitch: 1.15 },
      sad:       { rate: 0.9, pitch: 0.9 },
      angry:     { rate: 1.2, pitch: 0.95 },
      surprised: { rate: 1.05, pitch: 1.2 },
    };
    const p = presets[(emotion||'neutral').toLowerCase()] || presets.neutral;
    u.rate = rate ?? p.rate;
    u.pitch = pitch ?? p.pitch;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {
    // no-op if TTS fails
  }
}

// ---------------- Events ----------------
btnResumeAudio?.addEventListener('click', async () => {
  const st = await resumeAudioContext()
  log('AudioContext: ' + st)
  try {
    if (!state.audioDet) {
      const { detector, stream } = await AudioVisemeDetector.fromMic();
      state.audioDet = detector;
      state.micStream = stream;
      log('🎙️ Mic realtime visemes ligado');
    }
  } catch (e) {
    console.warn('Mic permission / setup failed', e);
  }
})
btnLoad?.addEventListener('click', () => {
  const url = inputUrl.value.trim()
  if (url) tryLoad(url)
})
inputFile?.addEventListener('change', () => {
  const f = inputFile.files?.[0]
  if (f) tryLoad('', f)
})
selPose?.addEventListener('change', () => {
  if (state.model) applyPoseTemplate(state.model, selPose.value)
})

// sliders de olhos (usam o animator)
eyeUD?.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value) // -1..1
  const curX = state.animator?.eyeTarget.x ?? 0
  state.animator?.setEyesTarget(curX, v)
})
eyeLR?.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value) // -1..1
  const curY = state.animator?.eyeTarget.y ?? 0
  state.animator?.setEyesTarget(v, curY)
})
blink?.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  animateBlink(val)
})

// botão de fala
btnSpeak?.addEventListener('click', async ()=>{
  if (!state.model || !state.lipsyncSystem) return
  const s = (txt?.value || 'Testing one two three.').trim()
  if (!s) return
  await resumeAudioContext()
  const emotion = 'neutral'
  state.lipsyncSystem.setEmotion?.(emotion)
  try {
    speakWithWebSpeech(s, { emotion })
    await state.lipsyncSystem.speak(s, { emotion })
  } catch (err) {
    console.error('speak failed', err)
  }
})

// ---------------- Loop ----------------
const clock = new THREE.Clock()
function tick() {
  const dt = clock.getDelta()
  state.animator?.update(dt)
  state.lipsync?.update(dt)
  if (state.audioDet && state.faceMesh) {
    const r = state.audioDet.update(dt)
    if (r) applyViseme(state.faceMesh, r.code, r.intensity, state.jawBone)
  }
  updateBlink(dt)
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

// resize mantém o enquadramento de retrato e atualiza renderer
window.addEventListener('resize', () => {
  const p = canvas.parentElement
  const w = p?.clientWidth  || window.innerWidth
  const h = p?.clientHeight || window.innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  if (state.model) framePortrait(state.model)
})

boot()