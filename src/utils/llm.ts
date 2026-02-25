import * as dotenv from 'dotenv';
dotenv.config();

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const llm = new ChatGoogleGenerativeAI({
  temperature: 0,
  model: 'gemini-2.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
});