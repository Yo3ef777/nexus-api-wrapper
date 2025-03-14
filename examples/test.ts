import UniversalAPIWrapper from '../src/app.js';

async function testAPI() {
  const api = new UniversalAPIWrapper({
    baseURL: 'https://jsonplaceholder.typicode.com',
    cacheEnabled: true,
    retryAttempts: 3,
  });

  try {
    // Test REST API
    console.log('Testing REST API...');
    const posts = await api.get('/posts');
    console.log('Posts:', posts.data.slice(0, 2));

    // Test POST request
    const newPost = await api.post('/posts', {
      title: 'Test Post',
      body: 'This is a test post',
      userId: 1,
    });
    console.log('New Post:', newPost.data);

    // Test GraphQL-like query
    console.log('\nTesting GraphQL-like query...');
    const query = `
      query {
        posts {
          id
          title
        }
      }
    `;
    const graphqlResponse = await api.queryGraphQL('/posts', query);
    console.log('GraphQL Response:', graphqlResponse.data);

    // Test WebSocket
    console.log('\nTesting WebSocket...');
    const ws = api.connectWebSocket('wss://echo.websocket.org', {
      onOpen: () => {
        console.log('WebSocket Connected!');
        ws.send(JSON.stringify({ message: 'Hello WebSocket!' }));
      },
      onMessage: (data) => {
        // Convert Buffer to string if needed
        const message = Buffer.isBuffer(data) ? data.toString() : data;
        console.log('WebSocket Message:', message);
        ws.close();
      },
      onError: (error) => {
        console.error('WebSocket Error:', error);
      },
      onClose: () => {
        console.log('WebSocket Closed!');
      },
    });

    console.log('\n✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
