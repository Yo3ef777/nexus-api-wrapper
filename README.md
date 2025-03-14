# NexusAPI

A powerful and flexible TypeScript library for interacting with REST, GraphQL, and WebSocket APIs. Features include automatic retries, caching, and comprehensive error handling.

## Features

- 🔄 **Universal Support**: Works with REST, GraphQL, and WebSocket APIs
- 💾 **Built-in Caching**: Configurable memory caching for improved performance
- 🔁 **Automatic Retries**: Configurable retry mechanism for failed requests
- 🔒 **Authentication**: Support for API Key, Bearer Token, and Basic Auth
- 📝 **TypeScript**: Written in TypeScript with full type definitions
- 🚀 **Modern**: Built on modern JavaScript features and best practices

## Installation

```bash
npm install nexusAPI 
```

## Quick Start

```typescript
import UniversalAPIWrapper from 'nexusAPI';

// Create a new instance
const api = new UniversalAPIWrapper({
  baseURL: 'https://api.example.com',
  cacheEnabled: true,
  retryAttempts: 3,
  timeout: 5000,
});

// REST API Example
const getData = async () => {
  try {
    const response = await api.get('/posts/1');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// GraphQL Example
const getGraphQLData = async () => {
  const query = `
    query {
      user(id: "1") {
        name
        email
      }
    }
  `;

  try {
    const response = await api.queryGraphQL('/graphql', query);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// WebSocket Example
const connectWebSocket = () => {
  const ws = api.connectWebSocket('wss://ws.example.com', {
    onMessage: (data) => console.log('Received:', data),
    onError: (error) => console.error('WebSocket error:', error),
  });
};
```

## Configuration

```typescript
const api = new UniversalAPIWrapper({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  retryAttempts: 3,
  cacheEnabled: true,
  cacheDuration: 300000, // 5 minutes
  auth: {
    apiKey: 'your-api-key',
    // or
    bearerToken: 'your-bearer-token',
    // or
    basicAuth: {
      username: 'user',
      password: 'pass',
    },
  },
});
```

## API Reference

### REST Methods

- `get(endpoint: string, params?: object)`
- `post(endpoint: string, data?: object)`
- `put(endpoint: string, data?: object)`
- `patch(endpoint: string, data?: object)`
- `delete(endpoint: string)`

### GraphQL Methods

- `queryGraphQL(endpoint: string, query: string, variables?: object)`
- `mutationGraphQL(endpoint: string, mutation: string, variables?: object)`

### WebSocket Methods

- `connectWebSocket(url: string, options?: WebSocketOptions)`

## Error Handling

The wrapper includes comprehensive error handling:

- Automatic retries for failed requests
- Detailed error messages
- Network error handling
- HTTP status code handling
- Authentication error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
