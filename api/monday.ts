import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_URL = 'https://api.monday.com/v2';

/**
 * Vercel serverless function to handle Monday.com API requests
 * This keeps the API token secure on the server side
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API token from server-side environment variable
  const apiToken = process.env.MONDAY_API_TOKEN;

  if (!apiToken) {
    console.error('MONDAY_API_TOKEN not configured');
    return res.status(500).json({ 
      error: 'Monday.com API token not configured',
      message: 'Please set MONDAY_API_TOKEN in Vercel environment variables'
    });
  }

  try {
    const { action, query, variables } = req.body;

    // Validate request body
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    let mondayQuery: string;
    let mondayVariables: any = variables || {};

    // Handle different actions
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
        // Convert columnValues object to JSON string if provided
        if (mondayVariables.columnValues) {
          mondayVariables.columnValues = JSON.stringify(mondayVariables.columnValues);
        }
        // Ensure boardId is an integer
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

    // Make request to Monday.com API
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

    // Log errors for debugging
    if (result.errors) {
      console.error('Monday.com API errors:', result.errors);
      return res.status(400).json({
        error: 'Monday.com API error',
        message: result.errors[0]?.message || 'Unknown error',
        errors: result.errors
      });
    }

    // Return successful response
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
}
