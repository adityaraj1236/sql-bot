import { SQLExecutionResult } from '../tools/executeSQLTool';

const MAX_PREVIEW_ROWS = 5;

export function buildSuccessBlocks(
  question: string,
  sql: string,
  result: SQLExecutionResult
): object[] {
  const previewRows = result.rows.slice(0, MAX_PREVIEW_ROWS);
  const hasMore = result.rowCount > MAX_PREVIEW_ROWS;

  // Build table header
  const header = result.fields.join(' | ');
  const divider = result.fields.map(() => '---').join(' | ');

  // Build table rows
  const rowLines = previewRows.map((row) =>
    result.fields.map((f) => String(row[f] ?? 'NULL')).join(' | ')
  );

  const tableText = ['```', header, divider, ...rowLines, '```'].join('\n');

  const blocks: object[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ' SQL Data Bot Result',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Your Question:*\n${question}`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Generated SQL:*\n\`\`\`${sql}\`\`\``,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Results* (${result.rowCount} total row${result.rowCount !== 1 ? 's' : ''}):\n${tableText}`,
      },
    },
  ];

  if (hasMore) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Showing first ${MAX_PREVIEW_ROWS} of ${result.rowCount} rows._`,
        },
      ],
    });
  }

  if (result.rowCount === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No records found for this query._',
      },
    });
  }

  return blocks;
}

export function buildErrorBlocks(question: string, errorMessage: string): object[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ' SQL Data Bot Error',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Your Question:*\n${question}`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error:*\n\`\`\`${errorMessage}\`\`\``,
      },
    },
  ];
}