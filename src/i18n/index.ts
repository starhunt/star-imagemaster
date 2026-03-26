import { en, TranslationKey } from './en';
import { ko } from './ko';

export type Language = 'auto' | 'en' | 'ko';

const translations: Record<string, Record<TranslationKey, string>> = {
  en,
  ko,
};

let currentLanguage: Language = 'auto';

function detectLanguage(): string {
  // Obsidian의 locale 설정 감지
  const obsidianLocale = (window as any)?.moment?.locale?.() || navigator.language;
  if (obsidianLocale.startsWith('ko')) return 'ko';
  return 'en';
}

function getEffectiveLanguage(): string {
  if (currentLanguage === 'auto') {
    return detectLanguage();
  }
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * 번역 문자열을 가져옵니다.
 * 변수 치환을 지원합니다: t('notice.deleted', { count: 3 }) → "Deleted 3 image(s)"
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const lang = getEffectiveLanguage();
  const dict = translations[lang] || translations['en'];
  let text = dict[key] || en[key] || key;

  if (vars) {
    for (const [varName, varValue] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(varValue));
    }
  }

  return text;
}

export type { TranslationKey };
