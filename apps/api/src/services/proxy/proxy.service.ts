import axios from 'axios';
import { credentials, eq, and } from '@repo/database';
import { db } from '../../shared/db.js';
import { decryptCredential } from '../../shared/encryption.js';

export const proxyService = {
  async listModels(credentialId: string, userId: string) {
    const rows = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, credentialId), eq(credentials.userId, userId)));

    const cred = rows[0];
    if (!cred) throw new Error('Credential not found');

    const data = decryptCredential(cred.data);
    const apiKey = data.apiKey;

    if (cred.type === 'openai_api_key' || cred.type === 'openrouter_api_key') {
      const baseUrl = cred.type === 'openai_api_key' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1';
      const r = await axios.get(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      return r.data.data
        .filter((m: any) => {
           const id = m.id.toLowerCase();
           if (cred.type === 'openai_api_key') return id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3');
           return true; 
        })
        .map((m: any) => ({
          id: cred.type === 'openai_api_key' ? `openai/${m.id}` : m.id,
          label: m.id,
          context_length: m.context_length,
          max_output_tokens: m.architecture?.tokenizer_config?.max_new_tokens || m.max_output_tokens || m.architecture?.max_output_tokens,
        }));
    }

    if (cred.type === 'google_api_key') {
      const r = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return r.data.models
        .filter((m: any) => m.name.startsWith('models/gemini'))
        .map((m: any) => ({
          id: m.name,
          label: m.displayName || m.name,
          context_length: m.inputTokenLimit,
          max_output_tokens: m.outputTokenLimit
        }));
    }

    if (cred.type === 'anthropic_api_key') {
      // Anthropic doesn't have a public models list endpoint like others, return common ones
      return [
        { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ];
    }

    return [];
  }
};
