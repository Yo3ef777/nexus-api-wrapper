import OpenAIWrapper from '../src/openai';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// بارگذاری متغیرهای محیطی
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAIWrapper({
  apiKey: process.env.OPENAI_API_KEY || '',
  cacheEnabled: true,
  maxRetries: 3,
});

// چت با GPT
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await openai.chat({
      messages,
      model: 'gpt-3.5-turbo',
    });
    res.json(response);
  } catch (error: any) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// تولید تصویر
app.post('/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.createImage({
      prompt,
      n: 1,
      size: '1024x1024',
    });
    res.json(response);
  } catch (error: any) {
    console.error('❌ Image Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// تبدیل صوت به متن
app.post('/transcribe', async (req, res) => {
  try {
    const { file } = req.body;
    const response = await openai.transcribe({
      file,
      model: 'whisper-1',
    });
    res.json(response);
  } catch (error: any) {
    console.error('❌ Transcription Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// خلاصه‌سازی متن
app.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    const summary = await openai.summarize(text, maxLength);
    res.json({ summary });
  } catch (error: any) {
    console.error('❌ Summarization Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ترجمه متن
app.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const translation = await openai.translate(text, targetLanguage);
    res.json({ translation });
  } catch (error: any) {
    console.error('❌ Translation Error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(3001, () => console.log('🚀 OpenAI Example Server running on port 3001'));
