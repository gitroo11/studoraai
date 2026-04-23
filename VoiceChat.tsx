import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Brain } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { callGroq } from '../lib/groq';
import { getGroqApiKey, getUserId } from '../lib/storage';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `És um tutor inteligente e simpático chamado Studora. Ajudas estudantes portugueses com explicações claras, exemplos práticos e muita paciência. Responde sempre em português. Se te perguntarem para resolver um problema, explica passo a passo. Se te pedirem um quiz, cria perguntas de múltipla escolha. Sê encorajador e positivo.`;

export default function VoiceChat() {
  const {
    isListening,
    isSpeaking,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    supported,
  } = useSpeech();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      setError('Insere a tua Groq API key nas Definições para começar.');
      return;
    }

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const conversationHistory = [...messages, userMessage]
        .map((m) => `${m.role === 'user' ? 'Estudante' : 'Tutor'}: ${m.content}`)
        .join('\n');

      const prompt = `Conversa até agora:\n${conversationHistory}\n\nResponde como tutor Studora à última mensagem do estudante.`;
      const response = await callGroq(prompt, SYSTEM_PROMPT);

      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
      speak(response.replace(/\*\*/g, '').replace(/#{1,6}\s/g, ''));

      await supabase.from('study_sessions').insert({
        user_id: userId,
        feature: 'voice_chat',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleMicToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleSpeakToggle() {
    if (isSpeaking) {
      stopSpeaking();
    } else if (messages.length > 0) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        speak(lastAssistant.content.replace(/\*\*/g, '').replace(/#{1,6}\s/g, ''));
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-700/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark-100">Chat por Voz</h1>
            <p className="text-xs text-dark-500">Fala com o teu tutor AI</p>
          </div>
        </div>
        <button
          onClick={handleSpeakToggle}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            isSpeaking
              ? 'bg-accent-500/20 text-accent-400'
              : 'bg-dark-800 text-dark-400 hover:text-dark-200'
          }`}
          title={isSpeaking ? 'Parar leitura' : 'Ler última resposta'}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500/10 to-accent-700/10 flex items-center justify-center">
              <Mic className="w-10 h-10 text-accent-500/40" />
            </div>
            <div>
              <p className="text-dark-300 font-medium">Pergunta qualquer coisa</p>
              <p className="text-dark-500 text-sm mt-1">
                Usa o microfone ou escreve a tua pergunta
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex animate-slide-up ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-500/15 text-accent-100 rounded-br-md'
                  : 'bg-dark-800 text-dark-200 rounded-bl-md border border-dark-700/50'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && <LoadingSpinner />}

        {(error || speechError) && (
          <div className="text-center py-2">
            <p className="text-red-400 text-sm">{error || speechError}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-1 py-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-accent-400 rounded-full animate-wave"
              style={{
                height: '16px',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
          <span className="ml-2 text-xs text-accent-400">AI a falar...</span>
        </div>
      )}

      {/* Input Area */}
      <div className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleMicToggle}
            className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${
              isListening
                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 animate-pulse'
                : 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700'
            }`}
            title={isListening ? 'Parar gravação' : 'Iniciar gravação'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={isListening && transcript ? transcript : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={
                isListening ? 'A ouvir...' : 'Escreve a tua pergunta...'
              }
              className="input-field pr-12"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isListening && (
          <div className="flex items-center justify-center mt-3 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Microfone ativo</span>
          </div>
        )}

        {!supported && (
          <p className="text-center text-dark-500 text-xs mt-2">
            O chat de voz requer Google Chrome.
          </p>
        )}
      </div>
    </div>
  );
}
