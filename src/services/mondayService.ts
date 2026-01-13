// Monday.com API Service
// This service handles all interactions with the Monday.com API via Vercel serverless function
// The API token is kept secure on the server side

const API_ROUTE = '/api/monday';

class MondayService {
  constructor() {
    // No API token needed - handled server-side
  }

  /**
   * Call the Vercel API route for Monday.com operations
   */
  private async callApiRoute(action: string, variables?: any, query?: string): Promise<any> {
    try {
      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          variables,
          query
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API route error:', result);
        throw new Error(result.message || result.error || 'Unknown error');
      }

      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Error calling API route:', error);
      throw error;
    }
  }

  /**
   * Execute a custom GraphQL query against Monday's API
   */
  async executeQuery(query: string, variables?: any): Promise<any> {
    return this.callApiRoute('customQuery', variables, query);
  }

  /**
   * Get all items from a specific board with their column values
   */
  async getBoardItems(boardId: string): Promise<any[]> {
    const query = `
      query ($boardId: [ID!]) {
        boards(ids: $boardId) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery(query, { boardId: parseInt(boardId) });
    return data.boards[0]?.items_page?.items || [];
  }

  /**
   * Get board columns information
   */
  async getBoardColumns(boardId: string): Promise<any[]> {
    const query = `
      query ($boardId: [ID!]) {
        boards(ids: $boardId) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const data = await this.executeQuery(query, { boardId: parseInt(boardId) });
    return data.boards[0]?.columns || [];
  }

  /**
   * Get unique values from a specific column across all items
   */
  async getUniqueColumnValues(boardId: string, columnId: string): Promise<string[]> {
    const items = await this.getBoardItems(boardId);
    const values = new Set<string>();

    items.forEach(item => {
      const column = item.column_values.find((col: any) => col.id === columnId);
      if (column && column.text) {
        values.add(column.text);
      }
    });

    return Array.from(values).sort();
  }

  /**
   * Get filtered column values based on previous selections
   * This is for cascading dropdowns - returns unique values in targetColumnId
   * where filterColumnId matches filterValue
   */
  async getFilteredColumnValues(
    boardId: string,
    targetColumnId: string,
    filters: { columnId: string; value: string }[]
  ): Promise<string[]> {
    const items = await this.getBoardItems(boardId);
    const values = new Set<string>();

    // Filter items based on all filter criteria
    const filteredItems = items.filter(item => {
      return filters.every(filter => {
        const column = item.column_values.find((col: any) => col.id === filter.columnId);
        return column && column.text === filter.value;
      });
    });

    // Extract unique values from target column
    filteredItems.forEach(item => {
      const column = item.column_values.find((col: any) => col.id === targetColumnId);
      if (column && column.text) {
        values.add(column.text);
      }
    });

    return Array.from(values).sort();
  }

  /**
   * Create a new item on a board
   */
  async createItem(
    boardId: string,
    itemName: string,
    columnValues?: Record<string, any>
  ): Promise<any> {
    const query = `
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

    const columnValuesJson = columnValues ? JSON.stringify(columnValues) : undefined;

    const data = await this.executeQuery(query, {
      boardId: parseInt(boardId),
      itemName,
      columnValues: columnValuesJson
    });

    return data.create_item;
  }

  /**
   * Create multiple items on a board
   */
  async createMultipleItems(
    boardId: string,
    items: { name: string; columnValues?: Record<string, any> }[]
  ): Promise<any[]> {
    const createdItems = [];
    
    for (const item of items) {
      const created = await this.createItem(boardId, item.name, item.columnValues);
      createdItems.push(created);
    }

    return createdItems;
  }

  /**
   * Test connection to Monday API
   */
  async testConnection(): Promise<boolean> {
    try {
      const query = `
        query {
          me {
            id
            name
            email
          }
        }
      `;

      const data = await this.executeQuery(query);
      console.log('Connected to Monday as:', data.me);
      return true;
    } catch (error) {
      console.error('Failed to connect to Monday:', error);
      return false;
    }
  }
}

// Export singleton instance
let mondayServiceInstance: MondayService | null = null;

export const initializeMondayService = (): MondayService => {
  mondayServiceInstance = new MondayService();
  return mondayServiceInstance;
};

export const getMondayService = (): MondayService => {
  if (!mondayServiceInstance) {
    throw new Error('Monday service not initialized. Call initializeMondayService first.');
  }
  return mondayServiceInstance;
};

export default MondayService;

