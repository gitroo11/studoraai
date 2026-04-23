import { getGroqApiKey } from './storage';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const LOADING_MESSAGES = [
  'A pensar...',
  'A processar o teu pedido...',
  'Quase lá...',
  'A gerar conteúdo inteligente...',
  'O AI está a trabalhar...',
  'Um momento, por favor...',
];

export function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Insere a tua Groq API key nas Definições para começar.');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  };

  const attempt = async (): Promise<string> => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg = errorData?.error?.message || `Erro ${response.status}`;
      throw new Error(`Erro da API Groq: ${msg}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sem resposta do AI.';
  };

  try {
    return await attempt();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Erro da API Groq')) {
      throw error;
    }
    await new Promise((r) => setTimeout(r, 2000));
    try {
      return await attempt();
    } catch {
      throw new Error('Falha na ligação à API. Verifica a tua chave e tenta novamente.');
    }
  }
}
