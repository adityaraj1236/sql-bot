import { DynamicTool } from '@langchain/core/tools';
import { executeQuery } from '../services/dbService';

export interface SQLExecutionResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: string[];
}

export const executeSQLTool = new DynamicTool({
  name: 'execute_sql',
  description: 'Executes a validated PostgreSQL SELECT query and returns the results.',
  func: async (sql: string): Promise<string> => {
    const result = await executeQuery(sql);

    const executionResult: SQLExecutionResult = {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      fields: result.fields.map((f) => f.name),
    };

    return JSON.stringify(executionResult);
  },
});