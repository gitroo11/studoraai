import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, User, Globe, Volume2, ExternalLink, Save, Check } from 'lucide-react';
import {
  getGroqApiKey,
  setGroqApiKey,
  getStudentName,
  setStudentName,
  getLanguage,
  setLanguage,
  getVoiceSpeed,
  setVoiceSpeed,
  getVoiceType,
  setVoiceType,
} from '../lib/storage';

export default function Settings() {
  const [apiKey, setApiKeyState] = useState(getGroqApiKey());
  const [name, setNameState] = useState(getStudentName());
  const [language, setLanguageState] = useState(getLanguage());
  const [voiceSpeed, setVoiceSpeedState] = useState(getVoiceSpeed());
  const [voiceType, setVoiceTypeState] = useState(getVoiceType());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available.filter((v) => v.lang.startsWith('pt') || v.lang.startsWith('en')));
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  function handleSave() {
    setGroqApiKey(apiKey);
    setStudentName(name);
    setLanguage(language);
    setVoiceSpeed(voiceSpeed);
    setVoiceType(voiceType);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-600/20 to-dark-700/20 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-dark-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Definições</h1>
          <p className="text-xs text-dark-500">Configura o teu Studora</p>
        </div>
      </div>

      {/* API Key */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-400" />
          <h3 className="font-semibold text-dark-200">Groq API Key</h3>
        </div>
        <p className="text-sm text-dark-500">
          Necessária para todas as funcionalidades de AI.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKeyState(e.target.value)}
          placeholder="gsk_..."
          className="input-field"
        />
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300 transition-colors"
        >
          Obter Groq API key gratuita
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Student Name */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-accent-400" />
          <h3 className="font-semibold text-dark-200">Nome do Estudante</h3>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setNameState(e.target.value)}
          placeholder="O teu nome"
          className="input-field"
        />
      </div>

      {/* Language */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent-400" />
          <h3 className="font-semibold text-dark-200">Idioma</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setLanguageState('pt')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              language === 'pt'
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
            }`}
          >
            Português
          </button>
          <button
            onClick={() => setLanguageState('en')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              language === 'en'
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-accent-400" />
          <h3 className="font-semibold text-dark-200">Voz do AI</h3>
        </div>

        <div>
          <label className="text-sm text-dark-400 mb-2 block">
            Velocidade: {voiceSpeed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeedState(parseFloat(e.target.value))}
            className="w-full accent-accent-500"
          />
          <div className="flex justify-between text-xs text-dark-600 mt-1">
            <span>Lenta</span>
            <span>Rápida</span>
          </div>
        </div>

        {voices.length > 0 && (
          <div>
            <label className="text-sm text-dark-400 mb-2 block">Tipo de Voz</label>
            <select
              value={voiceType}
              onChange={(e) => setVoiceTypeState(e.target.value)}
              className="input-field"
            >
              <option value="">Padrão</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => {
            const utterance = new SpeechSynthesisUtterance('Olá! Sou o Studora, o teu tutor de estudo.');
            utterance.lang = 'pt-PT';
            utterance.rate = voiceSpeed;
            if (voiceType) {
              const voice = voices.find((v) => v.name === voiceType);
              if (voice) utterance.voice = voice;
            }
            window.speechSynthesis.speak(utterance);
          }}
          className="btn-secondary text-sm"
        >
          Testar Voz
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`btn-primary w-full flex items-center justify-center gap-2 ${
          saved ? 'from-emerald-500 to-emerald-600' : ''
        }`}
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Guardado!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar Definições
          </>
        )}
      </button>
    </div>
  );
}
