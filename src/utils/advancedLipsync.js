// utils/advancedLipsync.js — Sistema avançado de lipsync com recursos extras
import { LipsyncEn } from '../lang/lipsync-en.mjs'
import { LipsyncPlayer } from './lipsyncPlayer.js'
import { parseRhubarb } from './rhubarb.js'
import { pickFaceMesh, debugFace, VISEME_MAP } from './lipsyncMap.js'

export class AdvancedLipsyncSystem {
  constructor(avatarRoot, options = {}) {
    this.avatarRoot = avatarRoot;
    this.options = {
      language: 'en',
      autoDetectMesh: true,
      enableEmotions: true,
      enableGestures: false,
      debugMode: false,
      quality: 'high', // low, medium, high
      ...options
    };

    // Inicializar componentes
    this.lipsyncEngine = new LipsyncEn();
    this.player = null;
    this.faceMesh = null;
    this.jawBone = null;

    // Estado do sistema
    this.isInitialized = false;
    this.currentEmotion = 'neutral';
    this.speakingSpeed = 1.0;
    this.intensity = 1.0;

    // Cache para performance
    this.sequenceCache = new Map();
    this.presets = new Map();

    this.initialize();
  }

  async initialize() {
    console.log('🚀 Inicializando sistema avançado de lipsync...');

    try {
      // Auto-detectar malha facial se habilitado
      if (this.options.autoDetectMesh) {
        this.faceMesh = pickFaceMesh(this.avatarRoot);
        if (this.options.debugMode && this.faceMesh) {
          debugFace(this.faceMesh);
        }
      }

      // Criar player
      this.player = new LipsyncPlayer(this.avatarRoot, {
        faceMesh: this.faceMesh,
        smoothTransitions: this.options.quality !== 'low',
        emotionalIntensity: this.intensity
      });

      // Análise de compatibilidade
      const compatibility = this.player.analyzeAvatar();

      if (!compatibility.compatible) {
        console.warn('⚠️ Avatar pode ter compatibilidade limitada com lipsync');
      }

      // Carregar presets emocionais
      this.loadEmotionalPresets();

      this.isInitialized = true;
      console.log('✅ Sistema de lipsync inicializado com sucesso');

      return {
        success: true,
        compatibility,
        faceMesh: this.faceMesh?.name,
        jawBone: this.player.jawBone?.name
      };

    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de lipsync:', error);
      return { success: false, error: error.message };
    }
  }

  loadEmotionalPresets() {
    // Presets para diferentes emoções
    this.presets.set('neutral', {
      speed: 1.0,
      emphasis: 1.0,
      jawIntensity: 1.0,
      mouthTension: 0.0
    });

    this.presets.set('happy', {
      speed: 1.1,
      emphasis: 1.2,
      jawIntensity: 1.1,
      mouthTension: 0.2
    });

    this.presets.set('sad', {
      speed: 0.8,
      emphasis: 0.9,
      jawIntensity: 0.8,
      mouthTension: -0.1
    });

    this.presets.set('angry', {
      speed: 1.3,
      emphasis: 1.4,
      jawIntensity: 1.2,
      mouthTension: 0.3
    });

    this.presets.set('surprised', {
      speed: 1.2,
      emphasis: 1.3,
      jawIntensity: 1.3,
      mouthTension: 0.1
    });

    this.presets.set('whisper', {
      speed: 0.7,
      emphasis: 0.6,
      jawIntensity: 0.5,
      mouthTension: -0.2
    });

    this.presets.set('excited', {
      speed: 1.4,
      emphasis: 1.5,
      jawIntensity: 1.4,
      mouthTension: 0.4
    });
  }

  // Método principal para falar texto
  async speak(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Sistema não inicializado. Chame initialize() primeiro.');
    }

    const {
      emotion = this.currentEmotion,
      speed = this.speakingSpeed,
      intensity = this.intensity,
      useCache = true,
      onProgress = null,
      onComplete = null
    } = options;

    console.log(`🗣️ Processando fala: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    try {
      // Verificar cache
      const cacheKey = `${text}-${emotion}-${speed}-${intensity}`;
      let sequence;

      if (useCache && this.sequenceCache.has(cacheKey)) {
        sequence = this.sequenceCache.get(cacheKey);
        console.log('📋 Usando sequência em cache');
      } else {
        // Processar texto para visemas
        sequence = this.processText(text, { emotion, speed, intensity });

        if (useCache) {
          this.sequenceCache.set(cacheKey, sequence);
        }
      }

      // Configurar callbacks
      if (onProgress) {
        this.onProgress = onProgress;
      }
      if (onComplete) {
        this.onComplete = onComplete;
      }

      // Reproduzir sequência
      this.player.loadSequence(sequence);
      this.player.play();

      return {
        success: true,
        duration: this.player.getDuration(),
        visemeCount: sequence.visemes.length
      };

    } catch (error) {
      console.error('❌ Erro ao processar fala:', error);
      throw error;
    }
  }

  processText(text, options = {}) {
    const {
      emotion = 'neutral',
      speed = 1.0,
      intensity = 1.0
    } = options;

    // Aplicar preset emocional
    const preset = this.presets.get(emotion) || this.presets.get('neutral');
    const adjustedSpeed = speed * preset.speed;
    const adjustedIntensity = intensity * preset.emphasis;

    // Converter texto para sequência de visemas
    const sequence = this.lipsyncEngine.convertWithEmotion(text, {
      speed: adjustedSpeed,
      emotion,
      emphasis: adjustedIntensity
    });

    console.log(`📊 Sequência gerada: ${sequence.visemes.length} visemas, duração estimada: ${sequence.times[sequence.times.length - 1]?.toFixed(2)}s`);

    return sequence;
  }

  // Controles de reprodução
  play() {
    if (this.player) {
      this.player.play();
    }
  }

  pause() {
    if (this.player) {
      this.player.pause();
    }
  }

  stop() {
    if (this.player) {
      this.player.stop();
    }
  }

  resume() {
    if (this.player) {
      this.player.resume();
    }
  }

  seekTo(time) {
    if (this.player) {
      this.player.seekTo(time);
    }
  }

  // Configurações dinâmicas
  setEmotion(emotion) {
    if (this.presets.has(emotion)) {
      this.currentEmotion = emotion;
      console.log(`😊 Emoção alterada para: ${emotion}`);
    } else {
      console.warn(`⚠️ Emoção não reconhecida: ${emotion}`);
    }
  }

  setSpeed(speed) {
    this.speakingSpeed = Math.max(0.1, Math.min(3.0, speed));
    if (this.player) {
      this.player.setTimeScale(1 / this.speakingSpeed);
    }
  }

  setIntensity(intensity) {
    this.intensity = Math.max(0.1, Math.min(2.0, intensity));
    if (this.player) {
      this.player.setIntensity(this.intensity);
    }
  }

  setSmoothTransitions(enabled) {
    if (this.player) {
      this.player.setSmoothTransitions(enabled);
    }
  }

  // Método para fala contínua com múltiplas frases
  async speakContinuous(phrases, options = {}) {
    const {
      pauseBetween = 0.5,
      onPhraseComplete = null,
      emotions = []
    } = options;

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      const emotion = emotions[i] || this.currentEmotion;

      console.log(`🎭 Falando frase ${i + 1}/${phrases.length} com emoção: ${emotion}`);

      await this.speak(phrase, { emotion, ...options });

      // Aguardar conclusão da frase
      await this.waitForCompletion();

      if (onPhraseComplete) {
        onPhraseComplete(i, phrase);
      }

      // Pausa entre frases
      if (i < phrases.length - 1 && pauseBetween > 0) {
        await this.delay(pauseBetween * 1000);
      }
    }
  }

  // Método de conveniência para aguardar conclusão
  waitForCompletion() {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (!this.player.playing) {
          resolve();
        } else {
          setTimeout(checkCompletion, 50);
        }
      };
      checkCompletion();
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Análise de texto para otimizações
  analyzeText(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Detectar características do texto
    const hasQuestions = /\?/.test(text);
    const hasExclamations = /!/.test(text);
    const hasEllipsis = /\.{3}/.test(text);
    const hasNumbers = /\d/.test(text);
    const hasUpperCase = /[A-Z]{2,}/.test(text);

    // Sugerir emoção baseada no texto
    let suggestedEmotion = 'neutral';
    if (hasExclamations) suggestedEmotion = 'excited';
    else if (hasQuestions) suggestedEmotion = 'curious';
    else if (hasEllipsis) suggestedEmotion = 'thoughtful';

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: words.length / sentences.length,
      hasQuestions,
      hasExclamations,
      hasEllipsis,
      hasNumbers,
      hasUpperCase,
      suggestedEmotion,
      estimatedDuration: words.length * 0.6 // segundos estimados
    };
  }

  // Status e informações
  getStatus() {
    return {
      initialized: this.isInitialized,
      playing: this.player?.playing || false,
      currentEmotion: this.currentEmotion,
      speed: this.speakingSpeed,
      intensity: this.intensity,
      faceMesh: this.faceMesh?.name,
      jawBone: this.player?.jawBone?.name,
      cacheSize: this.sequenceCache.size,
      playerStatus: this.player?.getStatus()
    };
  }

  // Limpeza
  dispose() {
    if (this.player) {
      this.player.stop();
    }
    this.sequenceCache.clear();
    this.presets.clear();
    this.isInitialized = false;
    console.log('🗑️ Sistema de lipsync descartado');
  }

  // Método estático para criar instância facilmente

  // --- TalkingHead-compatible helpers ---
  /**
   * Gera sequência de visemas a partir de texto e reproduz.
   */
  playText(text, { emotion='neutral', speed=1.0, emphasis=1.0 } = {}){
    const seq = this.lipsyncEngine.convertWithEmotion(text, { emotion, speed, emphasis });
    this.player.loadSequence(seq);
    this.player.play();
    return seq;
  }

  /**
   * Carrega saída do Rhubarb (JSON/CSV) e reproduz.
   */
  playRhubarb(dataStringOrObject, { timeScale } = {}){
    const seq = parseRhubarb(dataStringOrObject);
    this.player.loadSequence(seq, timeScale);
    this.player.play();
    return seq;
  }

  /**
   * Liga o lipsync em tempo real a partir do microfone.
   */
  async startMicRealtime(detectorFactory){
    // detectorFactory: optional function returning an object with update()->{code,intensity}
    if (detectorFactory){
      this.player.externalDetector = await detectorFactory();
    } else {
      // lazy import to avoid bundler issues if not used
      const { AudioVisemeDetector } = await import('./audioViseme.js');
      const det = await AudioVisemeDetector.fromMic();
      this.player.externalDetector = det;
    }
    return true;
  }
  static async create(avatarRoot, options = {}) {
    const system = new AdvancedLipsyncSystem(avatarRoot, options);
    await system.initialize();
    return system;
  }
}

// Função de conveniência para uso rápido
export async function createLipsyncSystem(avatarRoot, options = {}) {
  return await AdvancedLipsyncSystem.create(avatarRoot, options);
}

// Exportar também as classes base para uso avançado
export { LipsyncEn, LipsyncPlayer };
