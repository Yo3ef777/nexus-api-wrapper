import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import WebSocket from 'ws';
import memoryCache from 'memory-cache';

interface Auth {
  apiKey?: string;
  bearerToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  refreshToken?: string;
}

interface WrapperConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheDuration?: number;
  auth?: Auth;
  openAPIDocument?: any;
}

interface WebSocketOptions {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

class UniversalAPIWrapper {
  private config: Required<WrapperConfig>;
  private axiosInstance: AxiosInstance;

  constructor(config: WrapperConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      cacheEnabled: config.cacheEnabled || false,
      cacheDuration: config.cacheDuration || 300000,
      auth: config.auth || {},
      openAPIDocument: config.openAPIDocument || null,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      const headers = this.getAuthHeaders(config.headers);
      config.headers = new AxiosHeaders(headers);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleError(error)
    );
  }

  private getAuthHeaders(existingHeaders: any = {}): Record<string, string> {
    const headers = { ...existingHeaders };

    if (this.config.auth.apiKey) {
      headers['X-API-Key'] = this.config.auth.apiKey;
    }
    if (this.config.auth.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.auth.bearerToken}`;
    }
    if (this.config.auth.basicAuth) {
      const credentials = Buffer.from(
        `${this.config.auth.basicAuth.username}:${this.config.auth.basicAuth.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
    return headers;
  }

  private async handleResponse(response: AxiosResponse): Promise<any> {
    const data = this.parseResponse(response.data);
    if (this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(response.config);
      memoryCache.put(cacheKey, data, this.config.cacheDuration);
    }
    return response;
  }

  private async handleError(error: any): Promise<any> {
    if (error.response) {
      if (error.response.status === 401 && this.config.auth.refreshToken) {
        return this.refreshTokenAndRetry(error);
      }
    }
    throw error;
  }

  private async refreshTokenAndRetry(error: any): Promise<any> {
    const newToken = await this.getNewAccessToken();
    this.config.auth.bearerToken = newToken;
    error.config.headers['Authorization'] = `Bearer ${newToken}`;
    return this.axiosInstance(error.config);
  }

  private async getNewAccessToken(): Promise<string> {
    // Implement your token refresh logic here
    return 'new-access-token';
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(
      config.params || {}
    )}-${JSON.stringify(config.data || {})}`;
  }

  private parseResponse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }

  public async request(
    method: string,
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<any> {
    const cacheKey = this.getCacheKey({ method, url: endpoint, ...options });
    if (this.config.cacheEnabled) {
      const cachedData = memoryCache.get(cacheKey);
      if (cachedData) return cachedData;
    }

    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        const response = await this.axiosInstance({
          method,
          url: endpoint,
          ...options,
        });
        return response;
      } catch (error) {
        attempts++;
        if (attempts === this.config.retryAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  public async queryGraphQL(
    endpoint: string,
    query: string,
    variables: Record<string, any> = {}
  ): Promise<any> {
    return this.request('POST', endpoint, {
      data: { query, variables },
    });
  }

  public async mutationGraphQL(
    endpoint: string,
    mutation: string,
    variables: Record<string, any> = {}
  ): Promise<any> {
    return this.request('POST', endpoint, {
      data: { query: mutation, variables },
    });
  }

  public connectWebSocket(url: string, options: WebSocketOptions = {}): WebSocket {
    const ws = new WebSocket(url);

    ws.on('open', () => options.onOpen?.());
    ws.on('message', (data) => options.onMessage?.(this.parseResponse(data)));
    ws.on('error', (error) => options.onError?.(error));
    ws.on('close', () => options.onClose?.());

    return ws;
  }

  public async get(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    return this.request('GET', endpoint, { params });
  }

  public async post(
    endpoint: string,
    data: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<any> {
    return this.request('POST', endpoint, { data, ...config });
  }

  public async put(
    endpoint: string,
    data: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<any> {
    return this.request('PUT', endpoint, { data, ...config });
  }

  public async delete(endpoint: string, config: AxiosRequestConfig = {}): Promise<any> {
    return this.request('DELETE', endpoint, config);
  }

  public async patch(
    endpoint: string,
    data: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<any> {
    return this.request('PATCH', endpoint, { data, ...config });
  }
}

export default UniversalAPIWrapper;
