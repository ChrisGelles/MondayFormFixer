/**
 * Debug Helper Utilities
 * Use these in the browser console to test and debug Monday API connections
 */

import { getMondayService } from '../services/mondayService';
import mondayColumns from './mondayColumnHelper';

/**
 * Test connection to Monday API
 * Usage: await testConnection()
 */
export const testConnection = async () => {
  try {
    const service = getMondayService();
    const result = await service.testConnection();
    console.log('✅ Connection successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
};

/**
 * Get all columns from a board
 * Usage: await getBoardColumns('10021032653')
 */
export const getBoardColumns = async (boardId: string) => {
  try {
    const service = getMondayService();
    const columns = await service.getBoardColumns(boardId);
    console.log('📋 Board Columns:');
    console.table(columns.map(col => ({
      ID: col.id,
      Title: col.title,
      Type: col.type
    })));
    return columns;
  } catch (error) {
    console.error('❌ Error getting columns:', error);
    return [];
  }
};

/**
 * Get sample items from a board
 * Usage: await getSampleItems('10021032653', 5)
 */
export const getSampleItems = async (boardId: string, limit = 5) => {
  try {
    const service = getMondayService();
    const items = await service.getBoardItems(boardId);
    const sample = items.slice(0, limit);
    
    console.log(`📦 Sample Items (showing ${sample.length} of ${items.length}):`);
    sample.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1}: ${item.name} ---`);
      item.column_values.forEach((col: any) => {
        if (col.text) {
          console.log(`  ${col.id}: ${col.text}`);
        }
      });
    });
    
    return sample;
  } catch (error) {
    console.error('❌ Error getting items:', error);
    return [];
  }
};

/**
 * Test creating an item with specific column values
 * Usage: await testCreateItem('destination_board_id', 'Test Item', { text: 'value' })
 */
export const testCreateItem = async (
  boardId: string,
  itemName: string,
  columnValues: Record<string, any>
) => {
  try {
    const service = getMondayService();
    console.log('🔄 Creating test item...');
    console.log('Board ID:', boardId);
    console.log('Item Name:', itemName);
    console.log('Column Values:', columnValues);
    
    const result = await service.createItem(boardId, itemName, columnValues);
    console.log('✅ Item created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating item:', error);
    return null;
  }
};

/**
 * Get unique values from a specific column
 * Usage: await getUniqueValues('10021032653', 'text')
 */
export const getUniqueValues = async (boardId: string, columnId: string) => {
  try {
    const service = getMondayService();
    const values = await service.getUniqueColumnValues(boardId, columnId);
    console.log(`🎯 Unique values for column '${columnId}':`, values);
    return values;
  } catch (error) {
    console.error('❌ Error getting unique values:', error);
    return [];
  }
};

/**
 * Test the cascading filter logic
 * Usage: await testCascadingFilters('10021032653')
 */
export const testCascadingFilters = async (boardId: string) => {
  try {
    const service = getMondayService();
    
    console.log('🔍 Testing cascading filters...\n');
    
    // Get PA Categories
    const categories = await service.getUniqueColumnValues(boardId, 'text');
    console.log('Step 1 - PA Categories:', categories);
    
    if (categories.length === 0) {
      console.warn('⚠️  No categories found. Check column ID "text"');
      return;
    }
    
    // Pick first category and get depths
    const selectedCategory = categories[0];
    console.log(`\nSelected Category: "${selectedCategory}"`);
    
    const depths = await service.getFilteredColumnValues(
      boardId,
      'text0',
      [{ columnId: 'text', value: selectedCategory }]
    );
    console.log('Step 2 - Available Depths:', depths);
    
    if (depths.length === 0) {
      console.warn('⚠️  No depths found. Check column ID "text0"');
      return;
    }
    
    // Pick first depth and get types
    const selectedDepth = depths[0];
    console.log(`\nSelected Depth: "${selectedDepth}"`);
    
    const types = await service.getFilteredColumnValues(
      boardId,
      'text1',
      [
        { columnId: 'text', value: selectedCategory },
        { columnId: 'text0', value: selectedDepth }
      ]
    );
    console.log('Step 3 - Available Types:', types);
    
    if (types.length === 0) {
      console.warn('⚠️  No types found. Check column ID "text1"');
      return;
    }
    
    console.log('\n✅ Cascading filters working!');
    console.log('📝 Update these column IDs in ProjectAthenaForm.tsx:');
    console.log('  paCategory: "text"');
    console.log('  depth: "text0"');
    console.log('  type: "text1"');
    console.log('  (and so on for audience...)');
    
  } catch (error) {
    console.error('❌ Error testing cascade:', error);
  }
};

/**
 * Full diagnostic check
 * Usage: await runDiagnostics('10021032653', 'destination_board_id')
 */
export const runDiagnostics = async (sourceBoardId: string, destBoardId?: string) => {
  console.log('🔧 Running Monday Form Fixer Diagnostics...\n');
  
  // Test connection
  console.log('1️⃣ Testing API Connection...');
  await testConnection();
  
  // Get source board structure
  console.log('\n2️⃣ Checking Source Board Structure...');
  await getBoardColumns(sourceBoardId);
  
  // Get sample data
  console.log('\n3️⃣ Fetching Sample Data...');
  await getSampleItems(sourceBoardId, 3);
  
  // Test cascading
  console.log('\n4️⃣ Testing Cascade Logic...');
  await testCascadingFilters(sourceBoardId);
  
  // Check destination if provided
  if (destBoardId) {
    console.log('\n5️⃣ Checking Destination Board Structure...');
    await getBoardColumns(destBoardId);
  }
  
  console.log('\n✅ Diagnostics Complete!');
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).mondayDebug = {
    testConnection,
    getBoardColumns,
    getSampleItems,
    testCreateItem,
    getUniqueValues,
    testCascadingFilters,
    runDiagnostics,
    // Column helpers
    analyzeColumn: mondayColumns.analyzeColumn,
    getDropdownLabels: mondayColumns.getDropdownLabels,
    getUniqueValuesFromColumn: mondayColumns.getUniqueValuesFromColumn
  };
  
  console.log('🛠️  Monday Debug Tools Loaded!');
  console.log('Available commands:');
  console.log('  mondayDebug.testConnection()');
  console.log('  mondayDebug.getBoardColumns("board_id")');
  console.log('  mondayDebug.getSampleItems("board_id", 5)');
  console.log('  mondayDebug.getUniqueValues("board_id", "column_id")');
  console.log('  mondayDebug.analyzeColumn("board_id", "column_id") ⭐ NEW');
  console.log('  mondayDebug.getDropdownLabels("board_id", "column_id") ⭐ NEW');
  console.log('  mondayDebug.testCascadingFilters("board_id")');
  console.log('  mondayDebug.runDiagnostics("source_board_id", "dest_board_id")');
  console.log('  mondayDebug.testCreateItem("board_id", "Item Name", { text: "value" })');
}

export default {
  testConnection,
  getBoardColumns,
  getSampleItems,
  testCreateItem,
  getUniqueValues,
  testCascadingFilters,
  runDiagnostics
};

