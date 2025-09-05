// utils/animator.js — Eyes only (Left/Right) por OSSOS (eixo local)
// - Sem vertical. Sem morphs por defeito (podes ativar se quiseres).
// - Aplica yaw no eixo local escolhido ('x' | 'y' | 'z'), em cima da pose base.

import * as THREE from 'three'
import { getBones } from './skeletonMap.js'
import { safeSetMorph, findFirstMeshWithMorph } from './safeMorph.js'

export class AvatarAnimator {
  constructor(root, opts = {}) {
    this.root  = root
    this.bones = getBones(root)

    // (opcional) procurar face mesh com morphs
    this.faceMesh = opts.faceMesh || findFirstMeshWithMorph(
      root,
      'eyeLookRight','eyeLookLeft','eyeLookInLeft','eyeLookOutLeft',
      'eyeLookUpLeft','eyeLookUpRight','eyeLookDownLeft','eyeLookDownRight'
    )

    let hasEyeMorphs = false
    if (this.faceMesh) {
      hasEyeMorphs =
        safeSetMorph(this.faceMesh,'eyeLookRight',0) ||
        safeSetMorph(this.faceMesh,'eyeLookLeft',0)  ||
        safeSetMorph(this.faceMesh,'eyeLookInLeft',0) ||
        safeSetMorph(this.faceMesh,'eyeLookOutLeft',0)
    }
    this.useMorphs = !!opts.useMorphs && hasEyeMorphs   // por defeito: só ossos

    // encontrar ossos
    this.eyeBoneL = this._findByName(root, ['CC_Base_L_Eye','LeftEye','eye_L'])
    this.eyeBoneR = this._findByName(root, ['CC_Base_R_Eye','RightEye','eye_R'])
    if (!this.eyeBoneL || !this.eyeBoneR) this._autoDetectEyeBones()

    // guardar pose base (local)
    this.baseQuatL = this.eyeBoneL ? this.eyeBoneL.quaternion.clone() : null
    this.baseQuatR = this.eyeBoneR ? this.eyeBoneR.quaternion.clone() : null

    // estado
    this.time = 0
    this.saccadeT = 0
    this.nextSaccadeIn = this._rand(0.8, 2.2)
    this.eyeTarget  = new THREE.Vector2(0,0) // y ignorado
    this.eyeCurrent = new THREE.Vector2(0,0)
    this.enabled = true

    // config — só horizontal
    this.cfg = {
      eyeSaccadeSpeed: 6.0,
      autoSaccades: true,

      rangeX: 0.30,                        // alcance do alvo (-1..1)
      maxYawDeg: 10,                       // amplitude máx. em graus
      vergenceDeg: 2,                      // abre ligeiro cada olho

      yawAxis: 'z',                        // 'x' | 'y' | 'z'  (muda para 'y' se precisar)
      pitchAxis: 'x',                      // apenas para offset fixo
      eyeRestPitchDeg: -2,                 // ligeiro olhar para baixo
      eyeRestYawDeg: 0,                    // offset horizontal
      invertX: false,                      // inverte esquerda/direita

      // morphs (se ativares useMorphs:true)
      morphMax: 0.30
    }
  }

  // ---------- helpers ----------
  _findByName(root, list){
    let out=null
    root.traverse(o=>{ if(out) return; const n=o.name||''; if(list.includes(n)) out=o })
    return out
  }
  _autoDetectEyeBones(){
    const cand=[]
    this.root.updateMatrixWorld(true)
    this.root.traverse(o=>{ if(o?.name && /eye/i.test(o.name)) cand.push(o) })
    if (!cand.length) return

    const p = new THREE.Vector3(), lefts=[], rights=[]
    for (const o of cand){ o.getWorldPosition(p); (p.x<0?lefts:rights).push(o) }
    this.eyeBoneL = this.eyeBoneL || lefts[0]  || cand[0]
    this.eyeBoneR = this.eyeBoneR || rights[0] || cand[1] || cand[0]

    // atualizar bases se vieram agora
    this.baseQuatL = this.eyeBoneL ? this.eyeBoneL.quaternion.clone() : null
    this.baseQuatR = this.eyeBoneR ? this.eyeBoneR.quaternion.clone() : null
  }
  _rand(a,b){ return a + Math.random()*(b-a) }
  setEnabled(v){ this.enabled = !!v }

  // alvo externo: só horizontal
  setEyesTarget(nx, _ny){
    this.eyeTarget.set(THREE.MathUtils.clamp(nx,-1,1), 0)
    this.saccadeT = 0
    this.nextSaccadeIn = this._rand(0.6, 1.2)
  }

  _axisVecLocal(axis){ // eixo local do osso
    switch(axis){
      case 'x': return new THREE.Vector3(1,0,0)
      case 'y': return new THREE.Vector3(0,1,0)
      case 'z': return new THREE.Vector3(0,0,1)
      default:  return new THREE.Vector3(0,0,1)
    }
  }

  _applyEyeYawLocal(eyeBone, baseQuatLocal, sideSign, exNorm){
    if (!eyeBone || !baseQuatLocal) return

    const inv = this.cfg.invertX ? -1 : 1
    const yawDeg = (exNorm * this.cfg.maxYawDeg * inv) + (sideSign * this.cfg.vergenceDeg)
    const pitchDeg = this.cfg.eyeRestPitchDeg
    const restYawDeg = this.cfg.eyeRestYawDeg

    const yawAxis   = this._axisVecLocal(this.cfg.yawAxis)
    const pitchAxis = this._axisVecLocal(this.cfg.pitchAxis)

    const qRestYaw  = new THREE.Quaternion().setFromAxisAngle(yawAxis,   THREE.MathUtils.degToRad(restYawDeg))
    const qPitch    = new THREE.Quaternion().setFromAxisAngle(pitchAxis, THREE.MathUtils.degToRad(-pitchDeg))
    const qYaw      = new THREE.Quaternion().setFromAxisAngle(yawAxis,   THREE.MathUtils.degToRad(yawDeg))

    // base * restYaw * pitch * yaw
    const qLocal = baseQuatLocal.clone().multiply(qRestYaw).multiply(qPitch).multiply(qYaw)
    eyeBone.quaternion.copy(qLocal)
  }

  // ---------- update ----------
  update(dt){
    if(!this.enabled) return
    this.time += dt

    // saccades automáticos só no X
    if (this.cfg.autoSaccades) {
      this.saccadeT += dt
      if (this.saccadeT >= this.nextSaccadeIn){
        this.eyeTarget.set(this._rand(-this.cfg.rangeX, this.cfg.rangeX), 0)
        this.saccadeT = 0
        this.nextSaccadeIn = this._rand(0.9, 2.0)
      }
    }

    // suavização
    const s = 1 - Math.exp(-this.cfg.eyeSaccadeSpeed * dt)
    this.eyeCurrent.lerp(this.eyeTarget, s)

    // normalizado -1..1 limitado por rangeX
    const ex = THREE.MathUtils.clamp(this.eyeCurrent.x, -this.cfg.rangeX, this.cfg.rangeX)
    const exNorm = (this.cfg.rangeX > 0) ? (ex / this.cfg.rangeX) : 0

    if (this.useMorphs && this.faceMesh) {
      // ---- Morphs apenas horizontal (se ativares) ----
      const MAX = this.cfg.morphMax
      const lookR = exNorm > 0 ?  exNorm * MAX : 0
      const lookL = exNorm < 0 ? -exNorm * MAX : 0

      safeSetMorph(this.faceMesh,'eyeLookUpLeft',  0)
      safeSetMorph(this.faceMesh,'eyeLookUpRight', 0)
      safeSetMorph(this.faceMesh,'eyeLookDownLeft',0)
      safeSetMorph(this.faceMesh,'eyeLookDownRight',0)

      safeSetMorph(this.faceMesh,'eyeLookOutLeft',  lookR)
      safeSetMorph(this.faceMesh,'eyeLookInRight',  lookR)
      safeSetMorph(this.faceMesh,'eyeLookInLeft',   lookL)
      safeSetMorph(this.faceMesh,'eyeLookOutRight', lookL)

      safeSetMorph(this.faceMesh,'eyeLookRight', lookR)
      safeSetMorph(this.faceMesh,'eyeLookLeft',  lookL)
    } else {
      // ---- OSSOS: yaw local no eixo configurado ----
      this._applyEyeYawLocal(this.eyeBoneL, this.baseQuatL, -1, exNorm) // olho ESQ abre (vergência -)
      this._applyEyeYawLocal(this.eyeBoneR, this.baseQuatR, +1, exNorm) // olho DIR abre (vergência +)
    }
  }
}
