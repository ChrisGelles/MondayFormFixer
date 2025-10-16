/**
 * Helper utilities for extracting values from different Monday column types
 */

import { getMondayService } from '../services/mondayService';

/**
 * Get settings from a column (useful for dropdowns, status, etc.)
 */
export const getColumnSettings = async (boardId: string, columnId: string): Promise<any> => {
  try {
    const service = getMondayService();
    const columns = await service.getBoardColumns(boardId);
    const column = columns.find(col => col.id === columnId);
    
    if (!column) {
      console.error(`Column ${columnId} not found`);
      return null;
    }

    console.log(`Column: ${column.title} (${column.id})`);
    console.log(`Type: ${column.type}`);
    
    if (column.settings_str) {
      try {
        const settings = JSON.parse(column.settings_str);
        console.log('Settings:', settings);
        return settings;
      } catch (e) {
        console.log('Raw settings_str:', column.settings_str);
        return column.settings_str;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting column settings:', error);
    return null;
  }
};

/**
 * Get dropdown labels from a dropdown column
 */
export const getDropdownLabels = async (boardId: string, columnId: string): Promise<string[]> => {
  const settings = await getColumnSettings(boardId, columnId);
  
  if (settings && settings.labels) {
    const labels = Object.values(settings.labels).map((label: any) => label.name || label);
    console.log('Dropdown labels:', labels);
    return labels as string[];
  }
  
  return [];
};

/**
 * Get status labels from a status column
 */
export const getStatusLabels = async (boardId: string, columnId: string): Promise<string[]> => {
  const settings = await getColumnSettings(boardId, columnId);
  
  if (settings && settings.labels) {
    const labels = Object.values(settings.labels).map((label: any) => label);
    console.log('Status labels:', labels);
    return labels as string[];
  }
  
  return [];
};

/**
 * Get unique values from a column, handling different column types
 */
export const getUniqueValuesFromColumn = async (
  boardId: string,
  columnId: string
): Promise<string[]> => {
  try {
    const service = getMondayService();
    const columns = await service.getBoardColumns(boardId);
    const column = columns.find(col => col.id === columnId);
    
    if (!column) {
      console.error(`Column ${columnId} not found`);
      return [];
    }

    console.log(`Getting values from ${column.title} (type: ${column.type})`);

    // For dropdown or status columns, get from settings
    if (column.type === 'color' || column.type === 'dropdown') {
      const settings = column.settings_str ? JSON.parse(column.settings_str) : null;
      if (settings && settings.labels) {
        const labels = Object.values(settings.labels).map((label: any) => 
          typeof label === 'string' ? label : label.name
        );
        console.log(`Found ${labels.length} options from column settings`);
        return labels as string[];
      }
    }

    // For text columns, get unique values from items
    console.log('Extracting unique values from items...');
    const values = await service.getUniqueColumnValues(boardId, columnId);
    console.log(`Found ${values.length} unique values`);
    return values;
    
  } catch (error) {
    console.error('Error getting unique values:', error);
    return [];
  }
};

/**
 * Analyze a column and show all its details
 */
export const analyzeColumn = async (boardId: string, columnId: string) => {
  console.log(`\n📊 Analyzing column: ${columnId}\n`);
  
  try {
    const service = getMondayService();
    const columns = await service.getBoardColumns(boardId);
    const column = columns.find(col => col.id === columnId);
    
    if (!column) {
      console.error(`❌ Column ${columnId} not found`);
      return;
    }

    console.log('📝 Column Details:');
    console.log(`  Title: ${column.title}`);
    console.log(`  ID: ${column.id}`);
    console.log(`  Type: ${column.type}`);
    
    if (column.settings_str) {
      console.log('\n⚙️  Settings:');
      try {
        const settings = JSON.parse(column.settings_str);
        console.log(JSON.stringify(settings, null, 2));
        
        if (settings.labels) {
          console.log('\n🏷️  Available Labels/Options:');
          Object.entries(settings.labels).forEach(([_key, value]: [string, any]) => {
            console.log(`  - ${typeof value === 'string' ? value : value.name || value}`);
          });
        }
      } catch (e) {
        console.log(`  Raw: ${column.settings_str}`);
      }
    }

    // Get sample values from items
    console.log('\n📦 Sample values from items:');
    const items = await service.getBoardItems(boardId);
    const sampleValues = new Set<string>();
    
    items.slice(0, 10).forEach(item => {
      const col = item.column_values?.find((c: any) => c.id === columnId);
      if (col && col.text) {
        sampleValues.add(col.text);
      }
    });
    
    if (sampleValues.size > 0) {
      Array.from(sampleValues).forEach(val => console.log(`  - ${val}`));
    } else {
      console.log('  (no values found in items)');
    }
    
    console.log('\n✅ Analysis complete\n');
    
  } catch (error) {
    console.error('❌ Error analyzing column:', error);
  }
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).mondayColumns = {
    getColumnSettings,
    getDropdownLabels,
    getStatusLabels,
    getUniqueValuesFromColumn,
    analyzeColumn
  };
}

export default {
  getColumnSettings,
  getDropdownLabels,
  getStatusLabels,
  getUniqueValuesFromColumn,
  analyzeColumn
};

