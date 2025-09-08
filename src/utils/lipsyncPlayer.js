// utils/lipsyncPlayer.js — Player de lipsync aprimorado com transições suaves
import * as THREE from 'three'
import { applyViseme, resetMouth, pickFaceMesh, blendToViseme } from './lipsyncMap.js'

// Função de easing melhorada para transições mais naturais
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const easeInQuad = t => t * t;

export class LipsyncPlayer {
  constructor(root, {
    faceMesh = null,
    jawBone = null,
    timeScale = 0.06,
    smoothTransitions = true,
    emotionalIntensity = 1.0
  } = {}) {
    this.root = root;
    this.faceMesh = faceMesh || pickFaceMesh(root);
    this.jawBone = jawBone || this._findJaw(root);

    this.timeScale = timeScale;
    this.smoothTransitions = smoothTransitions;
    this.emotionalIntensity = emotionalIntensity;

    this.events = [];
    this.t = 0;
    this.playing = false;
    this.idx = 0;
    this.holdSilAtEnd = 0.12;

    // Novos recursos
    this.currentViseme = 'sil';
    this.targetViseme = 'sil';
    this.transitionProgress = 0;
    this.blendDuration = 0.08; // Duração da transição entre visemas
    this.intensity = 1.0;
    // Realtime (external detector)
    this.externalDetector = null;
    this.externalGain = 1.0;
    this.realtime = false;

    // Sistema de cache para performance
    this.morphCache = new Map();
    this.lastUpdateTime = 0;
    this.updateThreshold = 16; // ~60fps

    console.log(`🎭 LipsyncPlayer inicializado:`);
    console.log(`  • Face mesh: ${this.faceMesh?.name || 'não encontrada'}`);
    console.log(`  • Jaw bone: ${this.jawBone?.name || 'não encontrado'}`);
    console.log(`  • Transições suaves: ${this.smoothTransitions ? 'ativadas' : 'desativadas'}`);
  }

  _findJaw(root) {
    let jawBone = null;
    const jawNames = [
      'CC_Base_Jaw', 'CC_Base_JawRoot', 'Jaw', 'LowerJaw', 'jaw',
      'mixamorig:Jaw', 'mixamorig:Head_Jaw', 'Armature_Jaw', 'jaw_bone'
    ];

    root.traverse(obj => {
      if (jawBone) return;
      if (jawNames.some(name => obj.name.includes(name))) {
        jawBone = obj;
      }
    });

    return jawBone;
  }

  loadSequence(seq, timeScale) {
    if (timeScale) this.timeScale = timeScale;

    const { visemes, times, durations, emotion, emphasis } = seq;
    this.events = [];

    // Aplicar fatores emocionais se disponíveis
    if (emotion || emphasis) {
      this.emotionalIntensity = emphasis || 1.0;
      console.log(`🎭 Carregando sequência com emoção: ${emotion || 'neutral'}, ênfase: ${this.emotionalIntensity}`);
    }

    for (let i = 0; i < visemes.length; i++) {
      const t0 = (times[i] || 0) * this.timeScale;
      const d = (durations[i] || 1) * this.timeScale;
      this.events.push({
        code: visemes[i],
        t0,
        t1: t0 + d,
        intensity: this.emotionalIntensity
      });
    }

    // Adicionar silêncio no final
    if (this.events.length) {
      const last = this.events[this.events.length - 1];
      this.events.push({
        code: 'sil',
        t0: last.t1,
        t1: last.t1 + this.holdSilAtEnd,
        intensity: 1.0
      });
    }

    this.stop();
    console.log(`📊 Sequência carregada: ${this.events.length} eventos`);
  }

  play() {
    this.t = 0;
    this.idx = 0;
    this.playing = true;
    this.currentViseme = 'sil';
    this.targetViseme = 'sil';
    this.transitionProgress = 0;
    console.log('▶️ Reprodução iniciada');
  }

  stop() {
    this.playing = false;
    this.t = 0;
    this.idx = 0;
    this.currentViseme = 'sil';
    this.targetViseme = 'sil';
    this.transitionProgress = 0;

    if (this.faceMesh) resetMouth(this.faceMesh);
    if (this.jawBone) this.jawBone.rotation.x = 0;

    console.log('⏹️ Reprodução parada');
  }

  pause() {
    this.playing = false;
    console.log('⏸️ Reprodução pausada');
  }

  resume() {
    this.playing = true;
    console.log('▶️ Reprodução retomada');
  }

  // Método principal de atualização com throttling para performance
  update(deltaTime) {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateThreshold) return;
    this.lastUpdateTime = now;

    // Realtime path: driven by external detector (mic/file audio)
    if (this.externalDetector) {
      const out = this.externalDetector.update(deltaTime) || {};
      const code = out.code || out.viseme || 'sil';
      const intensity = Math.max(0, Math.min(1, (out.intensity ?? out.strength ?? 0)));
      this.applyRealtimeViseme(code, intensity, deltaTime);
      return;
    }

    // Sequence path
    if (!this.playing || this.events.length === 0) return;
    this.t += deltaTime;
    this._updateVisemes(deltaTime);
  }

  _updateVisemes(deltaTime) {
    // Encontrar evento atual
    while (this.idx < this.events.length) {
      const event = this.events[this.idx];

      if (this.t >= event.t0 && this.t < event.t1) {
        // Estamos dentro deste evento
        this._processCurrentEvent(event, deltaTime);
        return; // Importante: retornar aqui para não avançar eventos
      } else if (this.t >= event.t1) {
        // Evento terminou, avançar para o próximo
        this.idx++;
        if (this.idx >= this.events.length) {
          // Sequência terminou
          this.stop();
          return;
        }
        // Continue o loop para processar o próximo evento
      } else {
        // Ainda não chegamos neste evento (this.t < event.t0)
        // Aplicar silêncio
        if (this.faceMesh) {
          this._handleDirectTransition('sil', this.intensity);
        }
        return;
      }
    }
  }

  _processCurrentEvent(event, deltaTime) {
    const { code, t0, t1, intensity = 1.0 } = event;
    const eventDuration = t1 - t0;
    const eventProgress = (this.t - t0) / eventDuration;

    if (this.smoothTransitions) {
      this._handleSmoothTransition(code, eventProgress, intensity, deltaTime);
    } else {
      this._handleDirectTransition(code, intensity);
    }
  }

  _handleSmoothTransition(targetCode, eventProgress, intensity, deltaTime) {
    if (this.targetViseme !== targetCode) {
      // Novo visema alvo
      this.currentViseme = this.targetViseme;
      this.targetViseme = targetCode;
      this.transitionProgress = 0;
    }

    // Atualizar progresso da transição
    const transitionSpeed = 1 / this.blendDuration;
    this.transitionProgress += deltaTime * transitionSpeed;
    this.transitionProgress = Math.min(this.transitionProgress, 1);

    // Aplicar easing para transição mais natural
    const easedProgress = easeInOutCubic(this.transitionProgress);

    // Aplicar blend entre visemas
    if (this.faceMesh) {
      blendToViseme(
        this.faceMesh,
        this.currentViseme,
        this.targetViseme,
        easedProgress,
        intensity,
        this.jawBone
      );
    }

    // Quando a transição estiver completa
    if (this.transitionProgress >= 1) {
      this.currentViseme = this.targetViseme;
      this.transitionProgress = 0;
    }
  }

  _handleDirectTransition(code, intensity) {
    if (this.currentViseme !== code) {
      this.currentViseme = code;
      if (this.faceMesh) {
        applyViseme(this.faceMesh, code, intensity, this.jawBone);
      }
    }
  }

  // Configurações dinâmicas
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.1, Math.min(3, scale));
  }

  setSmoothTransitions(enabled) {
    this.smoothTransitions = enabled;
    console.log(`🔄 Transições suaves: ${enabled ? 'ativadas' : 'desativadas'}`);
  }

  setBlendDuration(duration) {
    this.blendDuration = Math.max(0.02, Math.min(0.2, duration));
  }

  // Informações de debug
  getStatus() {
    return {
      playing: this.playing,
      time: this.t,
      currentEvent: this.idx,
      totalEvents: this.events.length,
      currentViseme: this.currentViseme,
      targetViseme: this.targetViseme,
      transitionProgress: this.transitionProgress,
      progress: this.events.length > 0 ? this.idx / this.events.length : 0
    };
  }

  // Método para pular para um tempo específico
  seekTo(time) {
    this.t = Math.max(0, time);
    this.idx = 0;

    // Encontrar o índice correto
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].t0 <= this.t && this.t < this.events[i].t1) {
        this.idx = i;
        break;
      } else if (this.events[i].t0 > this.t) {
        this.idx = Math.max(0, i - 1);
        break;
      }
    }

    console.log(`⏭️ Pulando para tempo: ${time.toFixed(3)}s, evento: ${this.idx}`);
  }

  // Método para obter duração total
  getDuration() {
    if (this.events.length === 0) return 0;
    return this.events[this.events.length - 1].t1;
  }

  // Análise de compatibilidade do avatar
  analyzeAvatar() {
    if (!this.faceMesh) {
      console.warn('⚠️ Nenhuma malha facial encontrada para análise');
      return {
        compatible: false,
        morphTargets: 0,
        supportedVisemes: []
      };
    }

    const dict = this.faceMesh.morphTargetDictionary;
    if (!dict) {
      console.warn('⚠️ Malha facial não possui morph targets');
      return {
        compatible: false,
        morphTargets: 0,
        supportedVisemes: []
      };
    }

    const morphNames = Object.keys(dict);
    const supportedVisemes = [];

    // Verificar suporte para cada tipo de visema
    const visemeTests = {
      'aa': ['V_Open', 'viseme_aa', 'mouthOpen'],
      'E': ['V_Wide', 'viseme_E'],
      'I': ['V_Wide', 'viseme_I'],
      'O': ['V_Tight_O', 'viseme_O', 'mouthPucker'],
      'U': ['V_Tight', 'viseme_U'],
      'PP': ['V_Explosive', 'viseme_PP', 'mouthPress'],
      'SS': ['V_Affricate', 'viseme_SS'],
      'TH': ['V_Tongue_Out', 'viseme_TH'],
      'DD': ['V_Affricate', 'viseme_DD'],
      'FF': ['V_Dental_Lip', 'viseme_FF', 'mouthFunnel'],
      'kk': ['V_Tongue_Raise', 'viseme_kk'],
      'nn': ['V_Tongue_up', 'viseme_nn'],
      'RR': ['V_RR', 'viseme_RR'],
      'CH': ['V_CH', 'viseme_CH']
    };

    for (const [viseme, morphs] of Object.entries(visemeTests)) {
      if (morphs.some(morph => morph in dict)) {
        supportedVisemes.push(viseme);
      }
    }

    const compatibility = {
      compatible: supportedVisemes.length > 5,
      morphTargets: morphNames.length,
      supportedVisemes,
      coverage: supportedVisemes.length / Object.keys(visemeTests).length,
      hasJaw: !!this.jawBone
    };

    console.log('🔍 Análise de compatibilidade do avatar:');
    console.log(`  • Compatível: ${compatibility.compatible ? '✅' : '❌'}`);
    console.log(`  • Morph targets: ${compatibility.morphTargets}`);
    console.log(`  • Visemas suportados: ${supportedVisemes.join(', ')}`);
    console.log(`  • Cobertura: ${(compatibility.coverage * 100).toFixed(1)}%`);
    console.log(`  • Mandíbula: ${compatibility.hasJaw ? '✅' : '❌'}`);

    return compatibility;
  }

  useExternalDetector(detector, {gain=1.0} = {}) {
    this.externalDetector = detector || null;
    this.externalGain = gain;
    this.realtime = !!detector;
    if (this.realtime) {
      // stop sequence playback while realtime is active
      this.playing = true;
      this.events = this.events || [];
      console.log('🎙️ Lipsync: using external detector');
    } else {
      console.log('🛑 Lipsync: external detector cleared');
    }
  }

  applyRealtimeViseme(code, intensity = 0.8, deltaTime = 0.016) {
    if (!code) code = 'sil';
    const clamped = Math.max(0, Math.min(1, intensity * this.externalGain));
    // eventProgress can piggyback on intensity for shaping
    const eventProgress = clamped;
    this._handleSmoothTransition(code, eventProgress, clamped, deltaTime);
  }
}
