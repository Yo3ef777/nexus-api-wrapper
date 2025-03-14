import axios from "axios";
import WebSocket from "ws";
import memoryCache from "memory-cache";
const create = axios.create;
const _put = memoryCache.put;
const _get = memoryCache.get;

class UniversalAPIWrapper {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      cacheEnabled: config.cacheEnabled || false,
      cacheDuration: config.cacheDuration || 300000, // 5 minutes
      auth: config.auth || {},
      openAPIDocument: config.openAPIDocument || null,
      ...config,
    };

    this.axiosInstance = create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      config.headers = this.getAuthHeaders(config.headers);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleError(error)
    );
  }

  getAuthHeaders(existingHeaders = {}) {
    const headers = { ...existingHeaders };

    if (this.config.auth.apiKey) {
      headers["X-API-Key"] = this.config.auth.apiKey;
    }
    if (this.config.auth.bearerToken) {
      headers["Authorization"] = `Bearer ${this.config.auth.bearerToken}`;
    }
    if (this.config.auth.basicAuth) {
      const credentials = Buffer.from(
        `${this.config.auth.basicAuth.username}:${this.config.auth.basicAuth.password}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }
    return headers;
  }

  async handleResponse(response) {
    try {
      const data = this.parseResponse(response.data);
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(response.config);
        _put(cacheKey, data, this.config.cacheDuration);
      }
      return data;
    } catch (error) {
      throw new Error(`Response parsing error: ${error.message}`);
    }
  }

  async handleError(error) {
    if (error.response) {
      if (error.response.status === 401 && this.config.auth.refreshToken) {
        return this.refreshTokenAndRetry(error);
      }
      throw {
        status: error.response.status,
        message: error.response.data.message || error.message,
        data: error.response.data,
      };
    }
    throw error;
  }

  async refreshTokenAndRetry(error) {
    try {
      const newToken = await this.getNewAccessToken();
      this.config.auth.bearerToken = newToken;
      error.config.headers["Authorization"] = `Bearer ${newToken}`;
      return this.axiosInstance(error.config);
    } catch (refreshError) {
      throw refreshError;
    }
  }

  async getNewAccessToken() {
    return "new-access-token";
  }

  getCacheKey(config) {
    return `${config.method}-${config.url}-${JSON.stringify(
      config.params || {}
    )}-${JSON.stringify(config.data || {})}`;
  }

  parseResponse(data) {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }

  async request(method, endpoint, options = {}) {
    if (!method) {
      method = options.data ? "POST" : "GET";
    }

    const cacheKey = this.getCacheKey({ method, url: endpoint, ...options });
    if (this.config.cacheEnabled) {
      const cachedData = _get(cacheKey);
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
        if (attempts === this.config.retryAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  async queryGraphQL(endpoint, query, variables = {}) {
    return this.request("POST", endpoint, {
      data: { query, variables },
    });
  }

  async mutationGraphQL(endpoint, mutation, variables = {}) {
    return this.request("POST", endpoint, {
      data: { query: mutation, variables },
    });
  }

  connectWebSocket(url, options = {}) {
    const ws = new WebSocket(url, options);

    ws.on("open", () => options.onOpen?.());
    ws.on("message", (data) => options.onMessage?.(this.parseResponse(data)));
    ws.on("error", (error) => options.onError?.(error));
    ws.on("close", () => options.onClose?.());

    return ws;
  }

  async get(endpoint, params = {}) {
    return this.request("GET", endpoint, { params });
  }

  async post(endpoint, data = {}, config = {}) {
    return this.request("POST", endpoint, { data, ...config });
  }

  async put(endpoint, data = {}, config = {}) {
    return this.request("PUT", endpoint, { data, ...config });
  }

  async delete(endpoint, config = {}) {
    return this.request("DELETE", endpoint, config);
  }

  async patch(endpoint, data = {}, config = {}) {
    return this.request("PATCH", endpoint, { data, ...config });
  }
}

export default UniversalAPIWrapper;

// Usage Example:
/*
const apiWrapper = new UniversalAPIWrapper({
    baseURL: 'https://api.example.com',
    apiKey: 'your-api-key',
    cacheEnabled: true,
    retryAttempts: 3
});

// REST API calls
apiWrapper.get('/users')
    .then(users => console.log(users))
    .catch(error => console.error(error));

// WebSocket connection
const ws = apiWrapper.connectWebSocket('wss://websocket.example.com', {
    onMessage: (data) => console.log('Received:', data),
    onError: (error) => console.error('WebSocket error:', error)
});
*/
