import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import UniversalAPIWrapper from '../src/app.js';

const app = express();
app.use(express.json());
app.use(cors());

const api = new UniversalAPIWrapper({
  baseURL: 'https://jsonplaceholder.typicode.com',
  cacheEnabled: true,
  retryAttempts: 3,
});

app.all('/proxy/:endpoint', async (req, res) => {
  try {
    const method = req.method;
    const endpoint = `/${req.params.endpoint}`;
    const data = req.body;
    const params = req.query;

    const response = await api.request(method, endpoint, { params, data });
    res.json(response.data);
  } catch (error: unknown) {
    console.error('❌ API Proxy Error:', error);
    const errorResponse = error as { response?: { status?: number }; message?: string };
    res.status(errorResponse.response?.status || 500).json({
      message: errorResponse.message || 'Internal Server Error',
    });
  }
});

app.post('/graphql', async (req, res) => {
  try {
    const { query, variables } = req.body;
    const response = await api.queryGraphQL('', query, variables);
    res.json(response.data);
  } catch (error: unknown) {
    console.error('❌ GraphQL Proxy Error:', error);
    const errorResponse = error as { response?: { status?: number }; message?: string };
    res.status(errorResponse.response?.status || 500).json({
      message: errorResponse.message || 'Internal Server Error',
    });
  }
});

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('✅ WebSocket Client Connected');

  ws.on('message', async (message) => {
    try {
      const { url } = JSON.parse(message.toString());
      const wsConnection = api.connectWebSocket(url, {
        onMessage: (data) => ws.send(JSON.stringify(data)),
        onError: (error) => ws.send(JSON.stringify({ error: error.message })),
      });

      ws.on('close', () => wsConnection.close());
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid WebSocket request' }));
    }
  });
});

app.listen(3000, () => console.log('🚀 Express Server running on port 3000'));
