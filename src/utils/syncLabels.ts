import { getMondayService } from '../services/mondayService';

interface ColumnMapping {
  sourceColumnId: string;
  destColumnId: string;
  type: 'status' | 'dropdown';
}

export interface LabelDrift {
  sourceColumnId: string;
  destColumnId: string;
  sourceTitle: string;
  destTitle: string;
  type: 'status' | 'dropdown';
  missingLabels: string[];
}

// Column mappings between source and destination boards
const COLUMN_MAPPINGS: ColumnMapping[] = [
  { sourceColumnId: 'color_mkvnrc08', destColumnId: 'color_mkwrzjh2', type: 'status' },   // PA Category
  { sourceColumnId: 'color_mkvnyaj9', destColumnId: 'color_mkwr6zfj', type: 'status' },   // Depth
  { sourceColumnId: 'dropdown_mkvn675a', destColumnId: 'dropdown_mkwr1011', type: 'dropdown' }, // Type
  { sourceColumnId: 'color_mkvnh5kw', destColumnId: 'color_mkwr3jx0', type: 'status' },   // Audience
];

function missingDropdownLabels(sourceSettings: any, destSettings: any): string[] {
  const sourceLabels = sourceSettings.labels || [];
  const destLabels = destSettings.labels || [];
  const sourceDeactivated = sourceSettings.deactivated_labels || [];

  const activeSourceLabels = sourceLabels.filter((l: any) => !sourceDeactivated.includes(l.id));
  const destLabelNames = destLabels.map((l: any) => l.name);

  return activeSourceLabels
    .filter((l: any) => !destLabelNames.includes(l.name))
    .map((l: any) => l.name);
}

function missingStatusLabels(sourceSettings: any, destSettings: any): string[] {
  const sourceLabels = sourceSettings.labels || {};
  const destLabels = destSettings.labels || {};
  const sourceDeactivated = sourceSettings.deactivated_labels || [];
  const destLabelValues = Object.values(destLabels) as string[];

  return Object.entries(sourceLabels)
    .filter(([id, name]) => {
      const isDeactivated = sourceDeactivated.includes(Number(id));
      return !isDeactivated && !destLabelValues.includes(name as string);
    })
    .map(([, name]) => name as string);
}

/**
 * Compare mapped source/destination column labels and log any drift.
 * Read-only: never writes column settings. Errors are logged and swallowed.
 */
export const reportLabelDrift = async (
  sourceBoardId: string,
  destBoardId: string
): Promise<LabelDrift[]> => {
  try {
    const service = getMondayService();

    const [sourceColumns, destColumns] = await Promise.all([
      service.getBoardColumns(sourceBoardId),
      service.getBoardColumns(destBoardId)
    ]);

    const drifts: LabelDrift[] = [];

    for (const mapping of COLUMN_MAPPINGS) {
      const sourceCol = sourceColumns.find((c: any) => c.id === mapping.sourceColumnId);
      const destCol = destColumns.find((c: any) => c.id === mapping.destColumnId);

      if (!sourceCol || !destCol) {
        console.warn(
          `Label drift: could not find columns for mapping ${mapping.sourceColumnId} -> ${mapping.destColumnId}`
        );
        continue;
      }

      const sourceSettings = JSON.parse(sourceCol.settings_str || '{}');
      const destSettings = JSON.parse(destCol.settings_str || '{}');

      const missingLabels = mapping.type === 'dropdown'
        ? missingDropdownLabels(sourceSettings, destSettings)
        : missingStatusLabels(sourceSettings, destSettings);

      const drift: LabelDrift = {
        sourceColumnId: mapping.sourceColumnId,
        destColumnId: mapping.destColumnId,
        sourceTitle: sourceCol.title,
        destTitle: destCol.title,
        type: mapping.type,
        missingLabels
      };

      drifts.push(drift);

      console.warn(
        `Label drift: "${sourceCol.title}" -> "${destCol.title}"` +
          (missingLabels.length > 0
            ? `; active on source, absent on destination: ${missingLabels.join(', ')}`
            : '; no missing labels')
      );
    }

    return drifts;
  } catch (error) {
    console.warn('Label drift check failed; submit is not blocked.', error);
    return [];
  }
};
