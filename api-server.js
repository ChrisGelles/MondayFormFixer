// Simple local API server for development
// Mimics the Vercel serverless function behavior

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const app = express();
const PORT = 3001; // Different port from Vite

app.use(cors());
app.use(express.json());

const API_URL = 'https://api.monday.com/v2';

app.post('/api/monday', async (req, res) => {
  const apiToken = process.env.MONDAY_API_TOKEN;

  if (!apiToken) {
    console.error('MONDAY_API_TOKEN not configured');
    return res.status(500).json({ 
      error: 'Monday.com API token not configured',
      message: 'Please set MONDAY_API_TOKEN in .env file'
    });
  }

  try {
    const { action, query, variables } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    let mondayQuery;
    let mondayVariables = variables || {};

    switch (action) {
      case 'testConnection':
        mondayQuery = `
          query {
            me {
              id
              name
              email
            }
          }
        `;
        break;

      case 'createItem':
        if (!variables?.boardId || !variables?.itemName) {
          return res.status(400).json({ 
            error: 'Missing required parameters: boardId and itemName' 
          });
        }
        mondayQuery = `
          mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
            create_item(
              board_id: $boardId,
              item_name: $itemName,
              column_values: $columnValues
            ) {
              id
              name
            }
          }
        `;
        if (mondayVariables.columnValues) {
          mondayVariables.columnValues = JSON.stringify(mondayVariables.columnValues);
        }
        mondayVariables.boardId = parseInt(mondayVariables.boardId);
        break;

      case 'customQuery':
        if (!query) {
          return res.status(400).json({ error: 'Missing query parameter for customQuery action' });
        }
        mondayQuery = query;
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
        'API-Version': '2024-10'
      },
      body: JSON.stringify({
        query: mondayQuery,
        variables: mondayVariables
      })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('Monday.com API errors:', result.errors);
      return res.status(400).json({
        error: 'Monday.com API error',
        message: result.errors[0]?.message || 'Unknown error',
        errors: result.errors
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error in Monday.com API handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`   API endpoint: http://localhost:${PORT}/api/monday\n`);
});
