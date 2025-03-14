import { jest } from '@jest/globals';
import UniversalAPIWrapper from '../src/app';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import memoryCache from 'memory-cache';

const mockAxios = {
  create: jest.fn(() => ({
    request: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
};

jest.mock('axios', () => mockAxios);

// Mock memory-cache to prevent memory leaks
jest.mock('memory-cache', () => ({
  put: jest.fn(),
  get: jest.fn(),
  clear: jest.fn(),
}));

describe('UniversalAPIWrapper with JSONPlaceholder', () => {
  let wrapper: UniversalAPIWrapper;
  let axiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosInstance = mockAxios.create();
    wrapper = new UniversalAPIWrapper({
      baseURL: 'https://jsonplaceholder.typicode.com',
      cacheEnabled: true,
      retryAttempts: 3,
      timeout: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear any cached data
    memoryCache.clear();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Ensure all pending promises are resolved
    return new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('REST API Methods', () => {
    it('should fetch a post successfully', async () => {
      const mockResponse = {
        data: {
          userId: 1,
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse;

      axiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await wrapper.get('/posts/1');

      expect(result.data).toMatchObject({
        userId: 1,
        id: 1,
        title: expect.any(String),
        body: expect.any(String),
      });
    });

    it('should create a new post successfully', async () => {
      const requestData = {
        userId: 1,
        title: 'New Post',
        body: 'Test content',
      };

      const mockResponse = {
        data: {
          id: 101,
          ...requestData,
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse;

      axiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await wrapper.post('/posts', requestData);

      expect(result.data).toMatchObject({
        id: expect.any(Number),
        userId: 1,
        title: 'New Post',
        body: 'Test content',
      });
    });

    it('should handle request errors', async () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
        },
      };
      axiosInstance.request.mockRejectedValueOnce(error);

      await expect(wrapper.get('/posts/999')).rejects.toThrow(
        'Request failed with status code 404'
      );
    });
  });
});
