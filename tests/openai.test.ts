import { jest } from '@jest/globals';
import OpenAIWrapper from '../src/openai';

// Mock OpenAI client
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
  images: {
    generate: jest.fn(),
  },
};

// Mock OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAIClient);
});

describe('OpenAIWrapper', () => {
  let wrapper: OpenAIWrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = new OpenAIWrapper({
      apiKey: 'test-api-key',
      cacheEnabled: true,
      client: mockOpenAIClient,
    });
  });

  describe('Chat', () => {
    it('should make a chat completion request successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
      };
      (mockOpenAIClient.chat.completions.create as any).mockResolvedValueOnce(mockResponse);

      const response = await wrapper.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-3.5-turbo',
      });

      expect(response).toEqual(mockResponse);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-3.5-turbo',
      });
    });

    it('should handle chat completion errors', async () => {
      const error = new Error('API Error');
      (mockOpenAIClient.chat.completions.create as any).mockRejectedValueOnce(error);

      await expect(
        wrapper.chat({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-3.5-turbo',
        })
      ).rejects.toThrow('API Error');
    });
  });

  describe('Image Generation', () => {
    it('should generate an image successfully', async () => {
      const mockResponse = {
        data: [{ url: 'https://example.com/image.jpg' }],
      };
      (mockOpenAIClient.images.generate as any).mockResolvedValueOnce(mockResponse);

      const response = await wrapper.createImage({
        prompt: 'A test image',
        n: 1,
        size: '1024x1024',
      });

      expect(response).toEqual(mockResponse);
      expect(mockOpenAIClient.images.generate).toHaveBeenCalledWith({
        prompt: 'A test image',
        n: 1,
        size: '1024x1024',
      });
    });

    it('should handle image generation errors', async () => {
      const error = new Error('API Error');
      (mockOpenAIClient.images.generate as any).mockRejectedValueOnce(error);

      await expect(
        wrapper.createImage({
          prompt: 'A test image',
          n: 1,
          size: '1024x1024',
        })
      ).rejects.toThrow('API Error');
    });
  });

  describe('Text Analysis', () => {
    it('should analyze text successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Analysis result' } }],
      };
      (mockOpenAIClient.chat.completions.create as any).mockResolvedValueOnce(mockResponse);

      const result = await wrapper.analyze('Test text', 'Analyze this text');
      expect(result).toBe('Analysis result');
    });

    it('should summarize text successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Summary' } }],
      };
      (mockOpenAIClient.chat.completions.create as any).mockResolvedValueOnce(mockResponse);

      const result = await wrapper.summarize('Long text', 100);
      expect(result).toBe('Summary');
    });

    it('should translate text successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Translated text' } }],
      };
      (mockOpenAIClient.chat.completions.create as any).mockResolvedValueOnce(mockResponse);

      const result = await wrapper.translate('Hello', 'Persian');
      expect(result).toBe('Translated text');
    });

    it('should handle text analysis errors', async () => {
      const error = new Error('API Error');
      (mockOpenAIClient.chat.completions.create as any).mockRejectedValueOnce(error);

      await expect(wrapper.analyze('Test text', 'Analyze this text')).rejects.toThrow('API Error');
    });
  });
});
