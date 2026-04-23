const KEYS = {
  GROQ_API_KEY: 'groq_api_key',
  STUDENT_NAME: 'studora_student_name',
  LANGUAGE: 'studora_language',
  VOICE_SPEED: 'studora_voice_speed',
  VOICE_TYPE: 'studora_voice_type',
  USER_ID: 'studora_user_id',
} as const;

export function getGroqApiKey(): string {
  return localStorage.getItem(KEYS.GROQ_API_KEY) || '';
}

export function setGroqApiKey(key: string): void {
  localStorage.setItem(KEYS.GROQ_API_KEY, key);
}

export function getStudentName(): string {
  return localStorage.getItem(KEYS.STUDENT_NAME) || 'Estudante';
}

export function setStudentName(name: string): void {
  localStorage.setItem(KEYS.STUDENT_NAME, name);
}

export function getLanguage(): 'pt' | 'en' {
  return (localStorage.getItem(KEYS.LANGUAGE) as 'pt' | 'en') || 'pt';
}

export function setLanguage(lang: 'pt' | 'en'): void {
  localStorage.setItem(KEYS.LANGUAGE, lang);
}

export function getVoiceSpeed(): number {
  return parseFloat(localStorage.getItem(KEYS.VOICE_SPEED) || '1');
}

export function setVoiceSpeed(speed: number): void {
  localStorage.setItem(KEYS.VOICE_SPEED, speed.toString());
}

export function getVoiceType(): string {
  return localStorage.getItem(KEYS.VOICE_TYPE) || '';
}

export function setVoiceType(voice: string): void {
  localStorage.setItem(KEYS.VOICE_TYPE, voice);
}

export function getUserId(): string {
  let id = localStorage.getItem(KEYS.USER_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.USER_ID, id);
  }
  return id;
}
