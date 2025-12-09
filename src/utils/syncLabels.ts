import { getMondayService } from '../services/mondayService';

interface ColumnMapping {
  sourceColumnId: string;
  destColumnId: string;
  type: 'status' | 'dropdown';
}

// Column mappings between source and destination boards
const COLUMN_MAPPINGS: ColumnMapping[] = [
  { sourceColumnId: 'color_mkvnrc08', destColumnId: 'color_mkwrzjh2', type: 'status' },   // PA Category
  { sourceColumnId: 'color_mkvnyaj9', destColumnId: 'color_mkwr6zfj', type: 'status' },   // Depth
  { sourceColumnId: 'dropdown_mkvn675a', destColumnId: 'dropdown_mkwr1011', type: 'dropdown' }, // Type
  { sourceColumnId: 'color_mkvnh5kw', destColumnId: 'color_mkwr3jx0', type: 'status' },   // Audience
];

/**
 * Sync all mapped columns from source to destination board
 */
export const syncAllLabels = async (sourceBoardId: string, destBoardId: string): Promise<void> => {
  const service = getMondayService();
  
  // Get columns from both boards
  const [sourceColumns, destColumns] = await Promise.all([
    service.getBoardColumns(sourceBoardId),
    service.getBoardColumns(destBoardId)
  ]);
  
  for (const mapping of COLUMN_MAPPINGS) {
    const sourceCol = sourceColumns.find((c: any) => c.id === mapping.sourceColumnId);
    const destCol = destColumns.find((c: any) => c.id === mapping.destColumnId);
    
    if (!sourceCol || !destCol) {
      console.warn(`Could not find columns for mapping: ${mapping.sourceColumnId} -> ${mapping.destColumnId}`);
      continue;
    }
    
    const sourceSettings = JSON.parse(sourceCol.settings_str || '{}');
    const destSettings = JSON.parse(destCol.settings_str || '{}');
    
    if (mapping.type === 'dropdown') {
      await syncDropdownLabels(service, destBoardId, mapping.destColumnId, sourceSettings, destSettings);
    } else {
      await syncStatusLabels(service, destBoardId, mapping.destColumnId, sourceSettings, destSettings);
    }
  }
};

async function syncDropdownLabels(
  service: any,
  destBoardId: string,
  destColumnId: string,
  sourceSettings: any,
  destSettings: any
): Promise<void> {
  const sourceLabels = sourceSettings.labels || [];
  const destLabels = destSettings.labels || [];
  const sourceDeactivated = sourceSettings.deactivated_labels || [];
  
  // Get active source label names
  const activeSourceLabels = sourceLabels.filter((l: any) => !sourceDeactivated.includes(l.id));
  const destLabelNames = destLabels.map((l: any) => l.name);
  
  // Find labels that exist in source but not destination
  const missingLabels = activeSourceLabels.filter((l: any) => !destLabelNames.includes(l.name));
  
  if (missingLabels.length === 0) return;
  
  console.log(`Adding missing dropdown labels to ${destColumnId}:`, missingLabels.map((l: any) => l.name));
  
  // Find next available ID
  const maxId = destLabels.length > 0 ? Math.max(...destLabels.map((l: any) => l.id)) : 0;
  
  // Build updated labels array (keep existing, add missing)
  const updatedLabels = [
    ...destLabels,
    ...missingLabels.map((l: any, i: number) => ({ id: maxId + i + 1, name: l.name }))
  ];
  
  const newSettings = {
    ...destSettings,
    labels: updatedLabels
  };
  
  await updateColumnSettings(service, destBoardId, destColumnId, newSettings);
}

async function syncStatusLabels(
  service: any,
  destBoardId: string,
  destColumnId: string,
  sourceSettings: any,
  destSettings: any
): Promise<void> {
  const sourceLabels = sourceSettings.labels || {};
  const destLabels = destSettings.labels || {};
  const sourceDeactivated = sourceSettings.deactivated_labels || [];
  
  const destLabelValues = Object.values(destLabels) as string[];
  const missingLabels: Record<string, string> = {};
  
  // Find next available ID
  const existingIds = Object.keys(destLabels).map(Number).filter(n => !isNaN(n));
  let nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
  
  // Find labels in source but not in destination
  Object.entries(sourceLabels).forEach(([id, name]) => {
    const isDeactivated = sourceDeactivated.includes(Number(id));
    if (!isDeactivated && !destLabelValues.includes(name as string)) {
      missingLabels[nextId.toString()] = name as string;
      nextId++;
    }
  });
  
  if (Object.keys(missingLabels).length === 0) return;
  
  console.log(`Adding missing status labels to ${destColumnId}:`, Object.values(missingLabels));
  
  const newSettings = {
    ...destSettings,
    labels: { ...destLabels, ...missingLabels }
  };
  
  await updateColumnSettings(service, destBoardId, destColumnId, newSettings);
}

async function updateColumnSettings(
  service: any,
  boardId: string,
  columnId: string,
  settings: any
): Promise<void> {
  const mutation = `
    mutation ($boardId: ID!, $columnId: String!, $value: String!) {
      change_column_metadata(
        board_id: $boardId
        column_id: $columnId
        column_property: settings_str
        value: $value
      ) {
        id
      }
    }
  `;
  
  await service.executeQuery(mutation, {
    boardId: parseInt(boardId),
    columnId: columnId,
    value: JSON.stringify(settings)
  });
}
