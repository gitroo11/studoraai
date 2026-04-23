import { useState } from 'react';
import { FileText, Copy, Check, Brain } from 'lucide-react';
import { callGroq } from '../lib/groq';
import { getGroqApiKey, getUserId } from '../lib/storage';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface SummaryResult {
  summary: string;
  keyConcepts: string;
  importantItems: string;
}

export default function SmartSummary() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const userId = getUserId();

  async function generateSummary() {
    if (!input.trim()) return;

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      setError('Insere a tua Groq API key nas Definições para começar.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = `Analisa o seguinte texto e gera:

1. RESUMO ESTRUTURADO: Um resumo claro e organizado com secções e bullet points.
2. CONCEITOS-CHAVE: Lista dos 5-10 conceitos mais importantes com breve explicação.
3. DATAS/NOMES IMPORTANTES: Lista de datas, nomes e termos específicos relevantes.

Texto:
${input}

Responde em português. Usa formatação clara com títulos e bullet points.`;

      const response = await callGroq(prompt);

      const sections = response.split(/(?=##?\s)/i);
      let summary = '';
      let keyConcepts = '';
      let importantItems = '';

      if (sections.length >= 3) {
        summary = sections[0];
        keyConcepts = sections[1];
        importantItems = sections.slice(2).join('\n');
      } else {
        summary = response;
      }

      setResult({ summary, keyConcepts, importantItems });

      await supabase.from('summaries').insert({
        user_id: userId,
        input_text: input.substring(0, 500),
        summary: summary.substring(0, 2000),
        key_concepts: keyConcepts.substring(0, 1000),
      });

      await supabase.from('study_sessions').insert({
        user_id: userId,
        feature: 'summary',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Resumo Inteligente</h1>
          <p className="text-xs text-dark-500">Cola o teu texto e recebe um resumo estruturado</p>
        </div>
      </div>

      {/* Input */}
      <div className="card space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cola aqui as tuas notas, texto do livro, ou qualquer conteúdo que queiras resumir..."
          className="input-field min-h-[200px] resize-y"
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500">
            {input.length} caracteres
          </span>
          <button
            onClick={generateSummary}
            disabled={loading || !input.trim()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Brain className="w-4 h-4" />
            Gerar Resumo
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary */}
          <div className="card relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-dark-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-400" />
                Resumo Estruturado
              </h3>
              <button
                onClick={() => copyToClipboard(result.summary)}
                className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
              {result.summary}
            </div>
          </div>

          {/* Key Concepts */}
          {result.keyConcepts && (
            <div className="card">
              <h3 className="font-semibold text-dark-200 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                Conceitos-Chave
              </h3>
              <div className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                {result.keyConcepts}
              </div>
            </div>
          )}

          {/* Important Items */}
          {result.importantItems && (
            <div className="card">
              <h3 className="font-semibold text-dark-200 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                Datas e Nomes Importantes
              </h3>
              <div className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                {result.importantItems}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
