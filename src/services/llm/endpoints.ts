import type { LLMConfig } from '../interfaces';

const PROVIDER_BASE_URLS: Record<LLMConfig['provider'], string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com',
  custom: '',
  anthropic: '',
};

export function resolveLLMBaseURL(config: LLMConfig): string | undefined {
  const rawBaseURL = config.baseURL?.trim() || PROVIDER_BASE_URLS[config.provider];

  if (!rawBaseURL) {
    return undefined;
  }

  try {
    const url = new URL(rawBaseURL);
    url.pathname = url.pathname
      .replace(/\/+$/, '')
      .replace(/\/chat\/completions$/i, '')
      .replace(/\/models$/i, '');
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return rawBaseURL.replace(/\/+$/, '');
  }
}

export function getLLMEndpointURL(config: LLMConfig, path: string): string {
  const baseURL = resolveLLMBaseURL(config);

  if (!baseURL) {
    throw new Error('Base URL 不能为空');
  }

  return `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
}
