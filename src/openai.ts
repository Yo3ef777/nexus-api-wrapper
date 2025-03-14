import OpenAI from 'openai';
import UniversalAPIWrapper from './app';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  cacheEnabled?: boolean;
  cacheDuration?: number;
  // Add client for testing
  client?: any;
}

class OpenAIWrapper extends UniversalAPIWrapper {
  [x: string]: any;
  private openai: OpenAI;

  constructor(config: OpenAIConfig) {
    super({
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      timeout: config.timeout,
      retryAttempts: config.maxRetries,
      cacheEnabled: config.cacheEnabled,
      cacheDuration: config.cacheDuration,
      auth: {
        apiKey: config.apiKey,
      },
    });

    // Use provided client for testing or create real client
    this.openai =
      config.client ||
      new OpenAI({
        apiKey: config.apiKey,
        organization: config.organization,
        baseURL: config.baseURL,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      });
  }

  /**
   * چت با مدل‌های OpenAI
   */
  async chat(params: OpenAI.Chat.ChatCompletionCreateParams) {
    if (this.cacheEnabled) {
      const cacheKey = `chat-${JSON.stringify(params)}`;
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) return cachedResponse;
    }

    const response = await this.openai.chat.completions.create(params);

    if (this.cacheEnabled) {
      const cacheKey = `chat-${JSON.stringify(params)}`;
      await this.cacheResponse(cacheKey, response);
    }

    if ('choices' in response) {
      return response as OpenAI.Chat.ChatCompletion;
    }

    throw new Error('Invalid response format from OpenAI chat completion');
  }

  /**
   * ایجاد تصویر با DALL-E
   */
  async createImage(params: OpenAI.Images.ImageGenerateParams) {
    if (this.cacheEnabled) {
      const cacheKey = `image-${JSON.stringify(params)}`;
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) return cachedResponse;
    }

    const response = await this.openai.images.generate(params);

    if (this.cacheEnabled) {
      const cacheKey = `image-${JSON.stringify(params)}`;
      await this.cacheResponse(cacheKey, response);
    }

    return response;
  }

  /**
   * تبدیل صوت به متن
   */
  async transcribe(
    params: OpenAI.Audio.TranscriptionCreateParams
  ): Promise<OpenAI.Audio.Transcription> {
    const response = await this.openai.audio.transcriptions.create(params);
    return response;
  }

  /**
   * تبدیل متن به صوت
   */
  async createSpeech(params: OpenAI.Audio.SpeechCreateParams): Promise<ArrayBuffer> {
    const response = await this.openai.audio.speech.create(params);
    return response.arrayBuffer();
  }

  /**
   * تحلیل و استخراج اطلاعات از متن
   */
  async analyze(text: string, instructions: string): Promise<string> {
    const response = await this.chat({
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: text },
      ],
      model: 'gpt-3.5-turbo',
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * خلاصه‌سازی متن
   */
  async summarize(text: string, maxLength?: number): Promise<string> {
    const instructions = maxLength
      ? `Summarize the following text in no more than ${maxLength} words:`
      : 'Summarize the following text:';

    return this.analyze(text, instructions);
  }

  /**
   * ترجمه متن
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    const instructions = `Translate the following text to ${targetLanguage}:`;
    return this.analyze(text, instructions);
  }

  private async getCachedResponse(key: string): Promise<any> {
    return new Promise((resolve) => {
      const cached = this.getFromCache(key);
      resolve(cached);
    });
  }

  private async cacheResponse(key: string, response: any): Promise<void> {
    return new Promise((resolve) => {
      this.saveToCache(key, response);
      resolve();
    });
  }

  private getFromCache(key: string): any {
    return this.cacheEnabled ? this.get(key) : null;
  }

  private saveToCache(key: string, value: any): void {
    if (this.cacheEnabled) {
      this.put(key, value, this.cacheDuration);
    }
  }
}

export default OpenAIWrapper;
