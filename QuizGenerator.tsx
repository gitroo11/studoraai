import { useState } from 'react';
import { HelpCircle, Brain, ChevronRight, RotateCcw, Check, X } from 'lucide-react';
import { callGroq } from '../lib/groq';
import { getGroqApiKey, getUserId } from '../lib/storage';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface QuizQuestion {
  question: string;
  options?: string[];
  correct: string;
  explanation: string;
  type: 'multiple_choice' | 'true_false' | 'open';
}

export default function QuizGenerator() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizType, setQuizType] = useState<'multiple_choice' | 'true_false' | 'open'>('multiple_choice');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const userId = getUserId();

  async function generateQuiz() {
    if (!topic.trim()) return;

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      setError('Insere a tua Groq API key nas Definições para começar.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setAnswered(false);
    setQuizComplete(false);

    const typeLabel =
      quizType === 'multiple_choice'
        ? 'múltipla escolha (4 opções: A, B, C, D)'
        : quizType === 'true_false'
        ? 'verdadeiro ou falso'
        : 'resposta aberta';

    const diffLabel =
      difficulty === 'easy' ? 'fácil' : difficulty === 'medium' ? 'médio' : 'difícil';

    const prompt = `Cria um quiz de ${numQuestions} perguntas sobre: ${topic}

Tipo: ${typeLabel}
Dificuldade: ${diffLabel}

Responde EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
[
  {
    "question": "Pergunta aqui",
    "options": ["A) Opção", "B) Opção", "C) Opção", "D) Opção"],
    "correct": "A) Opção correta",
    "explanation": "Explicação da resposta correta",
    "type": "${quizType}"
  }
]

Para verdadeiro/falso, options deve ser ["Verdadeiro", "Falso"].
Para resposta aberta, options deve ser [] e correct deve ser a resposta esperada.
Responde em português.`;

    try {
      const response = await callGroq(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Formato de resposta inválido');

      const parsed = JSON.parse(jsonMatch[0]);
      setQuestions(parsed);

      await supabase.from('study_sessions').insert({
        user_id: userId,
        feature: 'quiz',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao gerar quiz. Tenta novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(answer: string) {
    if (answered) return;
    setSelectedAnswer(answer);
    setAnswered(true);

    const current = questions[currentQ];
    const isCorrect =
      answer.toLowerCase().trim() === current.correct.toLowerCase().trim() ||
      (current.type === 'true_false' &&
        ((answer === 'Verdadeiro' && current.correct === 'Verdadeiro') ||
          (answer === 'Falso' && current.correct === 'Falso')));

    if (isCorrect) {
      setScore((s) => s + 1);
    }
  }

  function handleOpenAnswer() {
    setAnswered(true);
    setAnswered(true);
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      setQuizComplete(true);
      saveQuizResult();
    } else {
      setCurrentQ((c) => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setAnswered(false);
    }
  }

  async function saveQuizResult() {
    await supabase.from('quizzes').insert({
      user_id: userId,
      topic: topic.substring(0, 200),
      questions,
      score,
      total: questions.length,
      difficulty,
    });
  }

  function resetQuiz() {
    setQuestions([]);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setAnswered(false);
    setQuizComplete(false);
  }

  const isCorrectAnswer = (answer: string) => {
    const current = questions[currentQ];
    return (
      answer.toLowerCase().trim() === current.correct.toLowerCase().trim() ||
      (current.type === 'true_false' &&
        ((answer === 'Verdadeiro' && current.correct === 'Verdadeiro') ||
          (answer === 'Falso' && current.correct === 'Falso')))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Gerador de Quiz</h1>
          <p className="text-xs text-dark-500">Cria quizzes personalizados do teu material</p>
        </div>
      </div>

      {/* Setup */}
      {questions.length === 0 && !loading && (
        <div className="card space-y-5">
          <div>
            <label className="text-sm font-medium text-dark-300 mb-2 block">
              Tópico ou Material de Estudo
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Revolução Francesa, Células e Organelas, Equações do 2º grau..."
              className="input-field min-h-[120px] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 block">
                Número de Perguntas
              </label>
              <div className="flex gap-2">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      numQuestions === n
                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                        : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 block">
                Dificuldade
              </label>
              <div className="flex gap-2">
                {[
                  { val: 'easy' as const, label: 'Fácil' },
                  { val: 'medium' as const, label: 'Médio' },
                  { val: 'hard' as const, label: 'Difícil' },
                ].map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setDifficulty(d.val)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      difficulty === d.val
                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                        : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 block">
                Tipo
              </label>
              <div className="flex gap-2">
                {[
                  { val: 'multiple_choice' as const, label: 'Escolha' },
                  { val: 'true_false' as const, label: 'V/F' },
                  { val: 'open' as const, label: 'Aberta' },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setQuizType(t.val)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      quizType === t.val
                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                        : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generateQuiz}
            disabled={!topic.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Gerar Quiz
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

      {/* Quiz Mode */}
      {questions.length > 0 && !quizComplete && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">
              Pergunta {currentQ + 1} de {questions.length}
            </span>
            <span className="text-accent-400 font-medium">
              Acertos: {score}/{currentQ + (answered ? 1 : 0)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-500"
              style={{
                width: `${((currentQ + (answered ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question */}
          <div className="card">
            <p className="text-lg font-medium text-dark-100 mb-6">
              {questions[currentQ].question}
            </p>

            {/* Options */}
            {questions[currentQ].type !== 'open' && questions[currentQ].options && (
              <div className="space-y-3">
                {questions[currentQ].options!.map((option, i) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = answered && isCorrectAnswer(option);
                  const showCorrect = answered && isCorrect;

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option)}
                      disabled={answered}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                        showCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : isSelected && !isCorrect
                          ? 'bg-red-500/10 border-red-500/40 text-red-300'
                          : 'bg-dark-850 border-dark-700 text-dark-300 hover:border-dark-600 hover:text-dark-200'
                      } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {showCorrect ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : isSelected && !isCorrect ? (
                        <X className="w-4 h-4 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 shrink-0 text-center text-xs font-bold text-dark-500">
                          {String.fromCharCode(65 + i)}
                        </span>
                      )}
                      <span className="text-sm">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Open answer */}
            {questions[currentQ].type === 'open' && (
              <div className="space-y-3">
                <textarea
                  value={selectedAnswer || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Escreve a tua resposta..."
                  className="input-field min-h-[100px] resize-y"
                  disabled={answered}
                />
                {!answered && (
                  <button
                    onClick={handleOpenAnswer}
                    disabled={!selectedAnswer}
                    className="btn-primary text-sm"
                  >
                    Submeter Resposta
                  </button>
                )}
              </div>
            )}

            {/* Explanation */}
            {answered && (
              <div className="mt-4 p-4 rounded-xl bg-dark-850 border border-dark-700 animate-fade-in">
                <p className="text-sm text-dark-300">
                  <span className="font-medium text-accent-400">Explicação: </span>
                  {questions[currentQ].explanation}
                </p>
              </div>
            )}
          </div>

          {/* Next button */}
          {answered && (
            <button
              onClick={nextQuestion}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {currentQ + 1 >= questions.length ? 'Ver Resultado' : 'Próxima Pergunta'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Quiz Complete */}
      {quizComplete && (
        <div className="card text-center space-y-6 animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-700/20 flex items-center justify-center">
            <Brain className="w-10 h-10 text-accent-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-100">Quiz Completo!</h2>
            <p className="text-dark-400 mt-1">
              Acertaste {score} de {questions.length} perguntas
            </p>
          </div>
          <div className="text-5xl font-bold text-gradient">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={resetQuiz} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Novo Quiz
            </button>
          </div>

          {/* Review wrong answers */}
          {score < questions.length && (
            <div className="text-left space-y-3 mt-4 pt-4 border-t border-dark-700">
              <h3 className="font-semibold text-dark-200">Respostas Erradas:</h3>
              {questions
                .map((q, i) => ({ ...q, index: i }))
                .slice(0, 5)
                .map((q) => (
                  <div key={q.index} className="p-3 rounded-xl bg-dark-850 border border-dark-700">
                    <p className="text-sm text-dark-300">{q.question}</p>
                    <p className="text-xs text-emerald-400 mt-1">
                      Resposta correta: {q.correct}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
