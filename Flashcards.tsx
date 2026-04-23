import { useState, useEffect, useCallback } from 'react';
import { Layers, Brain, RotateCcw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { callGroq } from '../lib/groq';
import { getGroqApiKey, getUserId } from '../lib/storage';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  learned: boolean;
  interval: number;
  next_review: string;
}

export default function Flashcards() {
  const [input, setInput] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [savedCards, setSavedCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'study'>('study');
  const userId = getUserId();

  useEffect(() => {
    loadSavedCards();
  }, []);

  async function loadSavedCards() {
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setSavedCards(
        data.map((d) => ({
          id: d.id,
          front: d.front,
          back: d.back,
          learned: d.learned,
          interval: d.interval,
          next_review: d.next_review,
        }))
      );
    }
  }

  async function generateFlashcards() {
    if (!input.trim()) return;

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      setError('Insere a tua Groq API key nas Definições para começar.');
      return;
    }

    setLoading(true);
    setError(null);
    setCards([]);

    try {
      const prompt = `Cria flashcards de estudo a partir do seguinte texto. Cada flashcard deve ter uma pergunta na frente e uma resposta concisa no verso.

Texto:
${input}

Responde EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
[
  {"front": "Pergunta aqui", "back": "Resposta aqui"}
]

Cria entre 5 e 15 flashcards. Responde em português.`;

      const response = await callGroq(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Formato de resposta inválido');

      const parsed = JSON.parse(jsonMatch[0]);
      const newCards: Flashcard[] = parsed.map((c: { front: string; back: string }) => ({
        front: c.front,
        back: c.back,
        learned: false,
        interval: 1,
        next_review: new Date().toISOString().split('T')[0],
      }));

      setCards(newCards);
      setMode('create');
      setCurrentIndex(0);
      setFlipped(false);

      for (const card of newCards) {
        await supabase.from('flashcards').insert({
          user_id: userId,
          front: card.front,
          back: card.back,
          source_text: input.substring(0, 500),
        });
      }

      await supabase.from('study_sessions').insert({
        user_id: userId,
        feature: 'flashcards',
      });

      await loadSavedCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar flashcards');
    } finally {
      setLoading(false);
    }
  }

  const markLearned = useCallback(async () => {
    const activeCards = cards.length > 0 ? cards : savedCards;
    const currentCard = activeCards[currentIndex];
    if (!currentCard) return;

    const newInterval = Math.min(currentCard.interval * 2, 30);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    if (currentCard.id) {
      await supabase
        .from('flashcards')
        .update({
          learned: true,
          interval: newInterval,
          next_review: nextReview.toISOString().split('T')[0],
        })
        .eq('id', currentCard.id);
    }

    if (cards.length > 0) {
      setCards((prev) =>
        prev.map((c, i) =>
          i === currentIndex
            ? { ...c, learned: true, interval: newInterval, next_review: nextReview.toISOString().split('T')[0] }
            : c
        )
      );
    } else {
      setSavedCards((prev) =>
        prev.map((c, i) =>
          i === currentIndex
            ? { ...c, learned: true, interval: newInterval, next_review: nextReview.toISOString().split('T')[0] }
            : c
        )
      );
    }

    goNext();
  }, [cards, savedCards, currentIndex]);

  const markReview = useCallback(async () => {
    const activeCards = cards.length > 0 ? cards : savedCards;
    const currentCard = activeCards[currentIndex];
    if (!currentCard) return;

    if (currentCard.id) {
      await supabase
        .from('flashcards')
        .update({
          learned: false,
          interval: 1,
          next_review: new Date().toISOString().split('T')[0],
        })
        .eq('id', currentCard.id);
    }

    goNext();
  }, [cards, savedCards, currentIndex]);

  function goNext() {
    const activeCards = cards.length > 0 ? cards : savedCards;
    if (currentIndex + 1 < activeCards.length) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }

  const activeCards = cards.length > 0 ? cards : savedCards;
  const currentCard = activeCards[currentIndex];
  const dueCards = savedCards.filter((c) => !c.learned || c.next_review <= new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-700/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Flashcards</h1>
          <p className="text-xs text-dark-500">
            {savedCards.length > 0
              ? `${dueCards.length} cartões para rever`
              : 'Gera flashcards a partir do teu material'}
          </p>
        </div>
      </div>

      {/* Create new or study existing */}
      {savedCards.length > 0 && cards.length === 0 && !loading && (
        <div className="flex gap-3">
          <button
            onClick={() => setMode('study')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              mode === 'study'
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                : 'bg-dark-850 text-dark-400 border border-dark-700'
            }`}
          >
            Estudar ({dueCards.length})
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              mode === 'create'
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                : 'bg-dark-850 text-dark-400 border border-dark-700'
            }`}
          >
            Criar Novos
          </button>
        </div>
      )}

      {/* Create Mode */}
      {(mode === 'create' || savedCards.length === 0) && cards.length === 0 && !loading && (
        <div className="card space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cola aqui o teu material de estudo para gerar flashcards automaticamente..."
            className="input-field min-h-[160px] resize-y"
            disabled={loading}
          />
          <button
            onClick={generateFlashcards}
            disabled={!input.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Gerar Flashcards
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Study Mode with saved cards */}
      {mode === 'study' && savedCards.length > 0 && cards.length === 0 && !loading && (
        <div className="space-y-4">
          {dueCards.length === 0 ? (
            <div className="card text-center py-12">
              <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-dark-200 font-medium">Todos os cartões estão revistos!</p>
              <p className="text-dark-500 text-sm mt-1">Volta mais tarde para continuar.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">
                  {currentIndex + 1} de {dueCards.length}
                </span>
                <span className="text-accent-400">
                  {dueCards.filter((c) => c.learned).length} aprendidos
                </span>
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="relative cursor-pointer"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="relative w-full min-h-[280px] transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front */}
                  <div
                    className="card absolute inset-0 flex items-center justify-center p-8"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-dark-500 mb-3">PERGUNTA</p>
                      <p className="text-lg font-medium text-dark-100 leading-relaxed">
                        {dueCards[currentIndex % dueCards.length]?.front}
                      </p>
                      <p className="text-xs text-dark-600 mt-6">Clica para ver a resposta</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="card absolute inset-0 flex items-center justify-center p-8 bg-accent-500/5 border-accent-500/20"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-accent-400 mb-3">RESPOSTA</p>
                      <p className="text-lg font-medium text-dark-100 leading-relaxed">
                        {dueCards[currentIndex % dueCards.length]?.back}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {flipped && (
                <div className="flex gap-3 animate-fade-in">
                  <button
                    onClick={markReview}
                    className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Rever Depois
                  </button>
                  <button
                    onClick={markLearned}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Aprendido
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Newly generated cards */}
      {cards.length > 0 && !loading && currentCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">
              {currentIndex + 1} de {cards.length}
            </span>
            <span className="text-accent-400">
              {cards.filter((c) => c.learned).length} aprendidos
            </span>
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="relative cursor-pointer"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full min-h-[280px] transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="card absolute inset-0 flex items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <p className="text-xs text-dark-500 mb-3">PERGUNTA</p>
                  <p className="text-lg font-medium text-dark-100 leading-relaxed">
                    {currentCard.front}
                  </p>
                  <p className="text-xs text-dark-600 mt-6">Clica para ver a resposta</p>
                </div>
              </div>

              {/* Back */}
              <div
                className="card absolute inset-0 flex items-center justify-center p-8 bg-accent-500/5 border-accent-500/20"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-center">
                  <p className="text-xs text-accent-400 mb-3">RESPOSTA</p>
                  <p className="text-lg font-medium text-dark-100 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-dark-200 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {flipped && (
              <div className="flex gap-3 animate-fade-in">
                <button
                  onClick={markReview}
                  className="py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Rever
                </button>
                <button
                  onClick={markLearned}
                  className="py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Aprendido
                </button>
              </div>
            )}

            <button
              onClick={goNext}
              disabled={currentIndex + 1 >= cards.length}
              className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-dark-200 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Done */}
          {cards.every((c) => c.learned) && (
            <div className="card text-center py-8 animate-fade-in">
              <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-dark-200 font-medium">Todos os flashcards revistos!</p>
              <button
                onClick={() => {
                  setCards([]);
                  setMode('study');
                  loadSavedCards();
                }}
                className="btn-secondary mt-4 flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Voltar aos Guardados
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
