import * as dotenv from 'dotenv';
dotenv.config();

import { DynamicTool } from '@langchain/core/tools';
import { llm } from '../utils/llm';
import { sqlPromptTemplate } from '../prompts/sqlPrompt';

function cleanSQL(raw: string): string {
  return raw
    .replace(/```sql/gi, '')
    .replace(/```/g, '')
    .replace(/^sql\s*/i, '')
    .trim();
}

export const generateSQLTool = new DynamicTool({
  name: 'generate_sql',
  description: 'Converts a natural language question into a PostgreSQL SELECT query using Gemini LLM.',
  func: async (question: string): Promise<string> => {
    const prompt = await sqlPromptTemplate.format({ question });
    const response = await llm.invoke(prompt);

    const rawSQL = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const cleanedSQL = cleanSQL(rawSQL);
    return cleanedSQL;
  },
});