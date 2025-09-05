// utils/lipsyncPlayer.js
import * as THREE from 'three'
import { applyViseme, resetMouth, pickFaceMesh } from './lipsyncMap.js'

const ease = t => (t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2)

export class LipsyncPlayer {
  constructor(root, { faceMesh=null, jawBone=null, timeScale=0.06 } = {}){
    this.root = root
    this.faceMesh = faceMesh || pickFaceMesh(root)
    this.jawBone  = jawBone  || this._findJaw(root)

    this.timeScale = timeScale   // segundos por “unidade” do lipsync-en
    this.events = []             // [{code, t0, t1}]
    this.t = 0
    this.playing = false
    this.idx = 0
    this.holdSilAtEnd = 0.12 // manter silêncio curto no fim para fechar boca
  }

  _findJaw(root){
    let out=null
    const names = ['CC_Base_Jaw','CC_Base_JawRoot','Jaw','LowerJaw','mixamorig:Jaw']
    root.traverse(o=>{ if(out) return; if (names.includes(o.name)) out=o })
    return out
  }

  loadSequence(seq, timeScale){
    if (timeScale) this.timeScale = timeScale
    const { visemes, times, durations } = seq
    this.events = []
    for (let i=0;i<visemes.length;i++){
      const t0 = (times[i]||0) * this.timeScale
      const d  = (durations[i]||1) * this.timeScale
      this.events.push({ code: visemes[i], t0, t1: t0 + d })
    }
    // append um silêncio curtinho
    if (this.events.length){
      const last = this.events[this.events.length-1]
      this.events.push({ code: 'sil', t0: last.t1, t1: last.t1 + this.holdSilAtEnd })
    }
    this.stop()
  }

  play(){ this.t=0; this.idx=0; this.playing = true }
  stop(){
    this.playing = false
    this.t = 0; this.idx = 0
    if (this.faceMesh) resetMouth(this.faceMesh)
    if (this.jawBone)  this.jawBone.rotation.x = 0
  }

  update(dt){
    if(!this.playing || !this.events.length) return

    this.t += dt
    // avança índice até cobrir tempo atual
    while (this.idx < this.events.length-1 && this.t >= this.events[this.idx+1].t0) this.idx++

    const cur = this.events[this.idx]
    const prev = this.events[this.idx-1]
    const next = this.events[this.idx+1]

    // peso do visema atual (curva suave dentro do seu intervalo)
    let wCur = 0
    if (cur && this.t>=cur.t0 && this.t<cur.t1){
      const u = (this.t - cur.t0) / (cur.t1 - cur.t0 + 1e-6)
      wCur = ease(Math.max(0, Math.min(1, u)))
    }

    // coarticulação: um bocadinho do anterior entra “de cauda”
    let wPrev = 0
    if (prev && this.t<cur.t0){
      const u = 1 - (cur.t0 - this.t) / Math.max(1e-3, (cur.t0 - prev.t0))
      wPrev = 0.35 * ease(Math.max(0, Math.min(1, u)))
    }

    // limpa
    if (this.faceMesh) resetMouth(this.faceMesh)

    // aplica
    if (prev) applyViseme(this.faceMesh, this.jawBone, prev.code, wPrev)
    if (cur)  applyViseme(this.faceMesh, this.jawBone, cur.code,  wCur)

    // terminou?
    const end = this.events[this.events.length-1].t1
    if (this.t >= end){ this.stop() }
  }
}
