import type { AppConfig, CharacterConfig, LLMConfig, ThemeMode } from '../interfaces';
import { DEFAULT_CHARACTER } from '../character';
import { readJSONFile, writeJSONFile } from '../storage';

const DEFAULT_CONFIG: AppConfig = {
  llm: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 2000,
  },
  characters: [DEFAULT_CHARACTER],
  activeCharacterId: DEFAULT_CHARACTER.id,
  activeProfileId: null,
  themeMode: 'system',
};

type StoredAppConfig = Partial<AppConfig> & {
  character?: Partial<CharacterConfig>;
};

function normalizeCharacter(character: Partial<CharacterConfig> | undefined, fallback: CharacterConfig): CharacterConfig {
  return {
    ...fallback,
    ...(character || {}),
    id: character?.id?.trim() || fallback.id,
    name: character?.name?.trim() || fallback.name,
    description: character?.description ?? fallback.description,
    scenario: character?.scenario ?? fallback.scenario,
    firstMessage: character?.firstMessage ?? fallback.firstMessage,
    systemPrompt: character?.systemPrompt ?? fallback.systemPrompt,
  };
}

function normalizeCharacters(parsed: StoredAppConfig): CharacterConfig[] {
  const rawCharacters = Array.isArray(parsed.characters) && parsed.characters.length > 0
    ? parsed.characters
    : [parsed.character || DEFAULT_CHARACTER];

  const usedIds = new Set<string>();

  return rawCharacters.map((character, index) => {
    const fallback = index === 0
      ? DEFAULT_CHARACTER
      : { ...DEFAULT_CHARACTER, id: `character_${index + 1}`, name: `角色 ${index + 1}` };
    const normalized = normalizeCharacter(character, fallback);
    let id = normalized.id;

    if (usedIds.has(id)) {
      id = `${id}_${index + 1}`;
    }

    usedIds.add(id);
    return { ...normalized, id };
  });
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : DEFAULT_CONFIG.themeMode;
}

function normalizeConfig(parsed: StoredAppConfig | null | undefined): AppConfig {
  if (!parsed) {
    return DEFAULT_CONFIG;
  }

  const characters = normalizeCharacters(parsed);
  const activeCharacterId = characters.some(character => character.id === parsed.activeCharacterId)
    ? parsed.activeCharacterId as string
    : characters[0].id;

  return {
    llm: { ...DEFAULT_CONFIG.llm, ...(parsed.llm || {}) },
    characters,
    activeCharacterId,
    activeProfileId: typeof parsed.activeProfileId === 'string' ? parsed.activeProfileId : null,
    themeMode: normalizeThemeMode(parsed.themeMode),
  };
}

function sanitizeConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    llm: { ...config.llm, apiKey: '' },
  };
}

export class ConfigService {
  private static readonly STORAGE_KEY = 'ai-girlfriend-config';
  private static readonly FILE_NAME = 'config.json';

  static load(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return normalizeConfig(JSON.parse(stored) as StoredAppConfig);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return DEFAULT_CONFIG;
  }

  static save(config: AppConfig): void {
    try {
      const sanitized = sanitizeConfig(config);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sanitized));
      void writeJSONFile(this.FILE_NAME, sanitized);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  static async loadPersistent(): Promise<AppConfig> {
    const fileConfig = await readJSONFile<StoredAppConfig>(this.FILE_NAME);

    if (fileConfig) {
      const config = normalizeConfig(fileConfig);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      return config;
    }

    const legacyConfig = this.load();
    await writeJSONFile(this.FILE_NAME, sanitizeConfig(legacyConfig));
    return legacyConfig;
  }

  static async savePersistent(config: AppConfig): Promise<void> {
    const sanitized = sanitizeConfig(config);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sanitized));
    await writeJSONFile(this.FILE_NAME, sanitized);
  }

  static updateLLM(llmConfig: Partial<LLMConfig>): void {
    const config = this.load();
    config.llm = { ...config.llm, ...llmConfig, apiKey: '' };
    this.save(config);
  }

  static updateCharacters(characters: CharacterConfig[], activeCharacterId?: string): void {
    const config = this.load();
    config.characters = characters;
    config.activeCharacterId = activeCharacterId || config.activeCharacterId;
    this.save(config);
  }

  static updateActiveProfile(activeProfileId: string | null): void {
    const config = this.load();
    config.activeProfileId = activeProfileId;
    this.save(config);
  }
}
