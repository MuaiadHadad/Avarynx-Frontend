// utils/faceIdle.js
import * as THREE from 'three'
import { safeSetMorph, findFirstMeshWithMorph } from './safeMorph.js'

const clamp01 = v => Math.max(0, Math.min(1, v))
const lerp = (a,b,t) => a + (b-a)*t

export class FaceIdle {
  constructor(root, faceMesh) {
    this.root = root
    this.faceMesh = faceMesh || findFirstMeshWithMorph(root,
      'browInnerUp','eyeSquintLeft','eyeSquintRight','mouthSmileLeft','mouthSmileRight','jawOpen','mouthClose','mouthPressLeft','mouthPressRight'
    )

    // tenta achar osso da mandíbula (fallback caso não existam morphs)
    this.jawBone = this._findByName(root, ['CC_Base_Jaw','CC_Base_JawRoot','Jaw','LowerJaw','mixamorig:Jaw'])

    this.time = 0
    this.cfg = {
      // intensidades max (0..1)
         browUpMax: 0.30,
         browDownMax: 0.22,
         squintMax: 0.22,
         smileMax: 0.28,
         pressMax: 0.18,
         jawOpenMax: 0.18, // subir para ver melhor em fallback
      // velocidades
      smooth: 6.0,            // suavização global
      changeEveryMin: 1.4,    // s
      changeEveryMax: 3.2,    // s
    }

    // “alvos” atuais
    this.target = {
      browInnerUp: 0,
      browDownL: 0, browDownR: 0,
      squintL: 0, squintR: 0,
      smileL: 0, smileR: 0,
      pressL: 0, pressR: 0,
      jaw: 0,
    }
    // valores correntes (suavizados)
    this.v = { ...this.target }

    this.nextChangeIn = this._rand(this.cfg.changeEveryMin, this.cfg.changeEveryMax)
  }

  _rand(a,b){ return a + Math.random()*(b-a) }
  _findByName(root, names){
    let out=null; root.traverse(o=>{ if(out) return; const n=o.name||''; if(names.includes(n)) out=o; })
    return out
  }

  _retarget(){
    // escolhe novos “micros”
    const t = this.target
    // brow: sobe/desce levemente; faz assimetria pequena
    t.browInnerUp = Math.random()*this.cfg.browUpMax
    const down = Math.random()*this.cfg.browDownMax
    t.browDownL = down * (0.4 + Math.random()*0.6)
    t.browDownR = down * (0.4 + Math.random()*0.6)

    // squint e wide leve (complementar às sobrancelhas)
    const sqBase = Math.random()*this.cfg.squintMax
    t.squintL = sqBase * (0.5 + Math.random()*0.5)
    t.squintR = sqBase * (0.5 + Math.random()*0.5)

    // mouth: micro sorriso/press assimétrico
    t.smileL = Math.random()*this.cfg.smileMax*0.9
    t.smileR = Math.random()*this.cfg.smileMax*0.9
    // não deixar ambos altos ao mesmo tempo
    if (t.smileL + t.smileR > this.cfg.smileMax) {
      if (t.smileL > t.smileR) t.smileL *= 0.5; else t.smileR *= 0.5
    }
    t.pressL = Math.random()*this.cfg.pressMax*0.6
    t.pressR = Math.random()*this.cfg.pressMax*0.6

    // jaw: abre um pouco (respiração/relax)
    t.jaw = Math.random()*this.cfg.jawOpenMax

    this.nextChangeIn = this._rand(this.cfg.changeEveryMin, this.cfg.changeEveryMax)
  }

  update(dt, breathingPhase01=0){
    this.time += dt
    this.nextChangeIn -= dt
    if (this.nextChangeIn <= 0) this._retarget()

    // mistura com respiração: abre ligeiro a boca no pico
    const jawBreath = (Math.sin(this.time*1.0)+1)/2 * 0.25 * this.cfg.jawOpenMax
    const jawTarget = clamp01(this.target.jaw*0.8 + jawBreath)

    // suavização exponencial
    const s = 1 - Math.exp(-this.cfg.smooth * dt)
    this.cfg.smooth = 3.0   // mais rápido
    this.cfg.smileMax = 0.45
    this.cfg.browUpMax = 0.45
    for (const k in this.v) {
      const tgt = (k==='jaw') ? jawTarget : this.target[k]
      this.v[k] = lerp(this.v[k], tgt, s)
    }

    // === aplicar morphs (ou fallback) ===
    if (this.faceMesh) {
      // brows
      safeSetMorph(this.faceMesh,'browInnerUp', this.v.browInnerUp)
      safeSetMorph(this.faceMesh,'browDownLeft', this.v.browDownL)
      safeSetMorph(this.faceMesh,'browDownRight', this.v.browDownR)
      safeSetMorph(this.faceMesh,'browOuterUpLeft', this.v.browInnerUp*0.6)
      safeSetMorph(this.faceMesh,'browOuterUpRight', this.v.browInnerUp*0.6)

      // eyelids squint (não conflita com blink se blink foi mais forte)
      safeSetMorph(this.faceMesh,'eyeSquintLeft',  this.v.squintL)
      safeSetMorph(this.faceMesh,'eyeSquintRight', this.v.squintR)

      // mouth
      safeSetMorph(this.faceMesh,'mouthSmileLeft',  this.v.smileL)
      safeSetMorph(this.faceMesh,'mouthSmileRight', this.v.smileR)
      safeSetMorph(this.faceMesh,'mouthPressLeft',  this.v.pressL)
      safeSetMorph(this.faceMesh,'mouthPressRight', this.v.pressR)

      safeSetMorph(this.faceMesh,'jawOpen', jawTarget)
      safeSetMorph(this.faceMesh,'mouthOpen', jawTarget) // alias comum
      // se jaw abre, reduz um pouco mouthClose/press para não “lutar”
      if (jawTarget>0.05){
        safeSetMorph(this.faceMesh,'mouthClose', clamp01(0.2 - jawTarget))
      }
    } else if (this.jawBone) {
      // fallback: roda a mandíbula ~X (abrir fecha)
      const angle = THREE.MathUtils.degToRad(12) * jawTarget / this.cfg.jawOpenMax
      this.jawBone.rotation.x = -angle
    }
  }
}
