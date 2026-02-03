import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI | null;
  private readonly model = 'text-embedding-3-small';

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;

    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY not set - embeddings disabled');
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('Embedding service unavailable: OPENAI_API_KEY not configured');
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: text.replace(/\n/g, ' '),
    });

    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('Embedding service unavailable: OPENAI_API_KEY not configured');
    }

    const sanitized = texts.map((t) => t.replace(/\n/g, ' '));

    const response = await this.client.embeddings.create({
      model: this.model,
      input: sanitized,
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
