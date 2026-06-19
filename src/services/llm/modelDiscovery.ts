import type { LLMConfig, LLMModelInfo } from '../interfaces';
import { llmFetchJSON } from './http';

type RawModel = {
  id?: unknown;
  name?: unknown;
  owned_by?: unknown;
  ownedBy?: unknown;
};

type RawModelResponse = {
  data?: unknown;
  models?: unknown;
};

function normalizeModelList(data: unknown): LLMModelInfo[] {
  const response = data as RawModelResponse;
  const rawModels = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.models)
      ? response.models
      : Array.isArray(data)
        ? data
        : [];

  return rawModels
    .map((model): LLMModelInfo | null => {
      if (typeof model === 'string') {
        return { id: model };
      }

      if (typeof model !== 'object' || model === null) {
        return null;
      }

      const rawModel = model as RawModel;
      const id = typeof rawModel.id === 'string'
        ? rawModel.id
        : typeof rawModel.name === 'string'
          ? rawModel.name.replace(/^models\//, '')
          : '';

      if (!id) {
        return null;
      }

      return {
        id,
        name: typeof rawModel.name === 'string' ? rawModel.name : undefined,
        ownedBy: typeof rawModel.owned_by === 'string'
          ? rawModel.owned_by
          : typeof rawModel.ownedBy === 'string'
            ? rawModel.ownedBy
            : undefined,
      };
    })
    .filter((model): model is LLMModelInfo => model !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function listLLMModels(config: LLMConfig): Promise<LLMModelInfo[]> {
  const data = await llmFetchJSON<unknown>(config, '/models');
  return normalizeModelList(data);
}
