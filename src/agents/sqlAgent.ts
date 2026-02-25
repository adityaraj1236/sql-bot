import { generateSQLTool } from '../tools/generateSQLTool';
import { executeSQLTool } from '../tools/executeSQLTool';
import { SQLExecutionResult } from '../tools/executeSQLTool';

export interface AgentResult {
  sql: string;
  result: SQLExecutionResult;
}

export async function runSQLAgent(question: string): Promise<AgentResult> {
  const sql = await generateSQLTool.invoke(question);

  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('Failed to generate a valid SQL query.');
  }
  const rawResult = await executeSQLTool.invoke(sql);

  let result: SQLExecutionResult;
  try {
    result = JSON.parse(rawResult as string) as SQLExecutionResult;
  } catch {
    throw new Error('Failed to parse SQL execution result.');
  }

  return { sql, result };
}