import express from "express";
import cors from "cors";
import UniversalAPIWrapper from "./app.js";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());
app.use(cors());

const api = new UniversalAPIWrapper({
  baseURL: "https://jsonplaceholder.typicode.com",
  cacheEnabled: true,
  retryAttempts: 3,
});

// **📌 پروکسی کردن درخواست‌های REST API**
app.all("/proxy/:endpoint", async (req, res) => {
  try {
    const method = req.method;
    const endpoint = `/${req.params.endpoint}`;
    const data = req.body;
    const params = req.query;

    const response = await api.request(method, endpoint, { params, data });
    res.json(response);
  } catch (error) {
    console.error("❌ API Proxy Error:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// **📌 پشتیبانی از GraphQL API**
app.post("/graphql", async (req, res) => {
  try {
    const { query, variables } = req.body;
    const response = await api.queryGraphQL("", query, variables);
    res.json(response);
  } catch (error) {
    console.error("❌ GraphQL Proxy Error:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// **📌 راه‌اندازی WebSocket Server برای APIهای بلادرنگ**
const wss = new WebSocketServer({ port: 8080 });
wss.on("connection", (ws) => {
  console.log("✅ WebSocket Client Connected");

  ws.on("message", async (message) => {
    try {
      const { url } = JSON.parse(message);
      const wsConnection = api.connectWebSocket(url, {
        onMessage: (data) => ws.send(JSON.stringify(data)),
        onError: (error) => ws.send(JSON.stringify({ error: error.message })),
      });

      ws.on("close", () => wsConnection.close());
    } catch (error) {
      ws.send(JSON.stringify({ error: "Invalid WebSocket request" }));
    }
  });
});

// **📌 سرور Express را روی پورت 3000 اجرا کن**
app.listen(3000, () => console.log("🚀 Express Server running on port 3000"));
