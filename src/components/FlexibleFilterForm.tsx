import { useState, useEffect } from 'react';
import { getMondayService } from '../services/mondayService';
import './FlexibleFilterForm.css';

interface EngagementOption {
  id: string;
  name: string;
  description: string;
  columnValues: Record<string, string>;
}

interface FlexibleFilterFormProps {
  sourceBoardId: string;
  destinationBoardId: string;
}

interface FilterCriterion {
  id: string;
  label: string;
  columnId: string;
}

const AVAILABLE_CRITERIA: FilterCriterion[] = [
  { id: 'paCategory', label: 'Theme', columnId: 'color_mkvnrc08' },
  { id: 'depth', label: 'Depth', columnId: 'color_mkvnyaj9' },
  { id: 'type', label: 'Type', columnId: 'dropdown_mkvn675a' },
  { id: 'audience', label: 'Audience', columnId: 'color_mkvnh5kw' },
];

// Normalize Type values from source board to match destination dropdown labels
// Destination dropdown labels: Tabling, Tabling/Gallery Talk, Field Trip, Dynamic Lecture, 
// Virtual Field Trip, Hybrid Engagement, Gallery Tour, Media, Gallery Talk
const normalizeTypeForDestination = (sourceType: string | null): string | null => {
  if (!sourceType) return null;
  
  const trimmed = sourceType.trim();
  
  // Map source board values to destination dropdown labels
  const typeMapping: Record<string, string> = {
    'Gallery Talk, Tabling': 'Tabling/Gallery Talk',
    'Tabling, Gallery Talk': 'Tabling/Gallery Talk',
  };
  
  // Check for exact match
  if (typeMapping[trimmed]) {
    return typeMapping[trimmed];
  }
  
  // Check for case-insensitive match
  const matchingKey = Object.keys(typeMapping).find(
    key => key.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchingKey) {
    return typeMapping[matchingKey];
  }
  
  // Return original if it matches a destination label (case-insensitive check)
  const destinationLabels = [
    'Tabling', 'Tabling/Gallery Talk', 'Field Trip', 'Dynamic Lecture',
    'Virtual Field Trip', 'Hybrid Engagement', 'Gallery Tour', 'Media', 'Gallery Talk'
  ];
  const matchingLabel = destinationLabels.find(
    label => label.toLowerCase() === trimmed.toLowerCase()
  );
  
  return matchingLabel || trimmed;
};

export const FlexibleFilterForm: React.FC<FlexibleFilterFormProps> = ({
  sourceBoardId,
  destinationBoardId
}) => {
  // User input fields
  const [engagementName, setEngagementName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventHour, setEventHour] = useState('');
  const [eventMinute, setEventMinute] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [requesterDescription, setRequesterDescription] = useState('');

  // Get current date for min attribute (prevent past dates)
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Update eventDateTime when date/time components change
  useEffect(() => {
    if (eventDate && eventHour && eventMinute) {
      setEventDateTime(`${eventDate}T${eventHour}:${eventMinute}`);
    } else {
      setEventDateTime('');
    }
  }, [eventDate, eventHour, eventMinute]);

  // Filter order - start with Theme pre-selected, rest optional
  const [filterOrder, setFilterOrder] = useState<string[]>(['paCategory', '', '', '']);
  
  // Filter selections - keyed by criterion ID
  const [filterSelections, setFilterSelections] = useState<Record<string, string>>({});
  
  // Available options for each criterion
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  
  // Loading states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Engagements
  const [selectedEngagement, setSelectedEngagement] = useState('');
  const [engagementOptions, setEngagementOptions] = useState<EngagementOption[]>([]);
  
  // Source items
  const [sourceItems, setSourceItems] = useState<any[]>([]);
  
  // Track which filters were manually set by user (vs auto-populated)
  const [manuallySetFilters, setManuallySetFilters] = useState<Set<string>>(new Set());
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [emailError, setEmailError] = useState('');

  const mondayService = getMondayService();

  // Status column ID for filtering Active items
  const STATUS_COLUMN_ID = 'color_mkxxab7g';

  // Load source items
  useEffect(() => {
    const loadSourceItems = async () => {
      setLoading(prev => ({ ...prev, source: true }));
      try {
        const items = await mondayService.getBoardItems(sourceBoardId);
        // Filter to only show items with Status = "Active"
        const activeItems = items.filter(item => {
          const statusColumn = item.column_values?.find((col: any) => col.id === STATUS_COLUMN_ID);
          return statusColumn && statusColumn.text === 'Active';
        });
        setSourceItems(activeItems);
      } catch (error) {
        console.error('Error loading source items:', error);
      } finally {
        setLoading(prev => ({ ...prev, source: false }));
      }
    };

    if (sourceBoardId) {
      loadSourceItems();
    }
  }, [sourceBoardId]);

  // Load options for the first filter position
  useEffect(() => {
    const loadFirstFilterOptions = async () => {
      if (!filterOrder[0]) return;
      
      const criterion = AVAILABLE_CRITERIA.find(c => c.id === filterOrder[0]);
      if (!criterion) return;

      setLoading(prev => ({ ...prev, [criterion.id]: true }));
      try {
        // Get values from actual items (not column settings) to ensure exact match during filtering
        const uniqueValues = new Set<string>();
        sourceItems.forEach(item => {
          const column = item.column_values?.find((c: any) => c.id === criterion.columnId);
          if (column && column.text) {
            uniqueValues.add(column.text);
          }
        });
        const values = Array.from(uniqueValues).sort();
        setFilterOptions(prev => ({ ...prev, [criterion.id]: values }));
      } catch (error) {
        console.error(`Error loading options for ${criterion.label}:`, error);
      } finally {
        setLoading(prev => ({ ...prev, [criterion.id]: false }));
      }
    };

    if (sourceBoardId) {
      loadFirstFilterOptions();
    }
  }, [sourceBoardId, filterOrder, sourceItems]);

  // When a filter is selected, load options for the next filter
  useEffect(() => {
    const loadNextFilterOptions = async () => {
      // Find the index of the last selected filter
      let lastSelectedIndex = -1;
      for (let i = 0; i < filterOrder.length; i++) {
        const criterionId = filterOrder[i];
        if (!criterionId) break; // Stop if we hit an empty criterion
        if (filterSelections[criterionId]) {
          lastSelectedIndex = i;
        } else {
          break;
        }
      }

      // Load options for the next filter if there is one
      if (lastSelectedIndex >= 0 && lastSelectedIndex < filterOrder.length - 1) {
        const nextCriterionId = filterOrder[lastSelectedIndex + 1];
        if (!nextCriterionId) return; // Skip if next criterion is empty
        
        const nextCriterion = AVAILABLE_CRITERIA.find(c => c.id === nextCriterionId);
        
        if (!nextCriterion) return;

        setLoading(prev => ({ ...prev, [nextCriterion.id]: true }));
        try {
          // Filter based on previous selections (skip empty criteria)
          const filters = filterOrder
            .slice(0, lastSelectedIndex + 1)
            .filter(id => id !== '')
            .map(criterionId => {
              const criterion = AVAILABLE_CRITERIA.find(c => c.id === criterionId);
              return {
                columnId: criterion!.columnId,
                value: filterSelections[criterionId]
              };
            });

          const filteredItems = sourceItems.filter(item => {
            return filters.every(filter => {
              const column = item.column_values?.find((c: any) => c.id === filter.columnId);
              if (!column) {
                return false;
              }
              // Compare text values (trim whitespace and handle case)
              const columnText = (column.text || '').trim();
              const filterValue = (filter.value || '').trim();
              return columnText === filterValue;
            });
          });

          const uniqueValues = new Set<string>();
          filteredItems.forEach(item => {
            const column = item.column_values?.find((c: any) => c.id === nextCriterion.columnId);
            if (column && column.text) {
              uniqueValues.add(column.text);
            }
          });

          const values = Array.from(uniqueValues).sort();
          setFilterOptions(prev => ({ ...prev, [nextCriterion.id]: values }));
        } catch (error) {
          console.error(`Error loading options for ${nextCriterion.label}:`, error);
        } finally {
          setLoading(prev => ({ ...prev, [nextCriterion.id]: false }));
        }
      }
    };

    if (sourceItems.length > 0) {
      loadNextFilterOptions();
    }
  }, [filterSelections, sourceItems, filterOrder]);

  // Load engagement options - either all or filtered based on selections
  useEffect(() => {
    if (sourceItems.length === 0) {
      setEngagementOptions([]);
      return;
    }

    // Check which filters have been selected
    const selectedFilters = Object.entries(filterSelections).filter(([_, value]) => value !== '' && value !== null && value !== undefined);
    
    // Debug: Log current filter state
    console.log('🔍 FILTERING ENGAGEMENTS - Current state:', {
      sourceItemsCount: sourceItems.length,
      filterSelections: JSON.stringify(filterSelections),
      selectedFiltersCount: selectedFilters.length,
      selectedFilters: selectedFilters.map(([id, val]) => ({ id, value: val }))
    });
    
    // If no filters selected, show all engagements
    if (selectedFilters.length === 0) {
      const allEngagements = sourceItems.map(item => ({
        id: item.id,
        name: item.name || '',
        description: item.column_values?.find((c: any) => c.id === 'text_mkvnh9sm')?.text || '',
        columnValues: {}
      }));
      setEngagementOptions(allEngagements);
    } else {
      // Filter items based on selected filter values
      const filters = selectedFilters.map(([criterionId, value]) => {
        const criterion = AVAILABLE_CRITERIA.find(c => c.id === criterionId);
        if (!criterion) {
          console.error(`❌ Criterion not found: ${criterionId}`);
          return null;
        }
        const filter = {
          columnId: criterion.columnId,
          value: String(value).trim()
        };
        console.log(`📋 Filter: ${criterion.label} (${criterion.columnId}) = "${filter.value}"`);
        return filter;
      }).filter((f): f is { columnId: string; value: string } => f !== null);

      // If no valid filters, show all engagements
      if (filters.length === 0) {
        const allEngagements = sourceItems.map(item => ({
          id: item.id,
          name: item.name || '',
          description: item.column_values?.find((c: any) => c.id === 'text_mkvnh9sm')?.text || '',
          columnValues: {}
        }));
        setEngagementOptions(allEngagements);
        return;
      }

      const filteredItems = sourceItems.filter(item => {
        // Item must match ALL filters
        const matchesAllFilters = filters.every(filter => {
          const column = item.column_values?.find((c: any) => c.id === filter.columnId);
          if (!column) {
            // Column not found - item doesn't match this filter
            return false;
          }
          
          // Get the column's text value (this is what Monday.com uses for status columns)
          const columnText = (column.text || '').trim();
          const filterValue = (filter.value || '').trim();
          
          // Must match exactly - if text doesn't match, item is excluded
          const matches = columnText === filterValue;
          
          // Debug logging for Theme filter to see what's happening
          if (filter.columnId === 'color_mkvnrc08') {
            console.log(`Item "${item.name}": Theme="${columnText}", Filter="${filterValue}", Match=${matches}`);
          }
          
          return matches;
        });
        
        return matchesAllFilters;
      });
      
      // Debug: Log filtering results
      console.log(`🔍 Filtering Results:`, {
        totalItems: sourceItems.length,
        filteredCount: filteredItems.length,
        filters: filters.map(f => ({ columnId: f.columnId, value: f.value })),
        filteredItemNames: filteredItems.map(i => i.name),
        excludedCount: sourceItems.length - filteredItems.length
      });

      const engagements = filteredItems.map(item => ({
        id: item.id,
        name: item.name || '',
        description: item.column_values?.find((c: any) => c.id === 'text_mkvnh9sm')?.text || '',
        columnValues: {}
      }));

      setEngagementOptions(engagements);
    }
  }, [filterSelections, sourceItems]);
  
  // Clear selected engagement if it no longer matches current filters
  useEffect(() => {
    if (selectedEngagement && engagementOptions.length > 0) {
      const stillMatches = engagementOptions.some(e => e.id === selectedEngagement);
      if (!stillMatches) {
        setSelectedEngagement('');
      }
    }
  }, [engagementOptions, selectedEngagement]);

  // Auto-select last criterion when only one option remains
  useEffect(() => {
    filterOrder.forEach((criterionId, position) => {
      // Skip if already has a criterion
      if (criterionId) return;
      
      // Get selected criteria before this position
      const selectedCriteria = filterOrder.filter((id, idx) => idx < position && id !== '');
      
      // Find available criteria for this position
      const availableCriteria = AVAILABLE_CRITERIA.filter(
        c => !selectedCriteria.includes(c.id)
      );
      
      // If only one option available, auto-select it
      if (availableCriteria.length === 1) {
        const newOrder = [...filterOrder];
        newOrder[position] = availableCriteria[0].id;
        setFilterOrder(newOrder);
      }
    });
  }, [filterOrder]);

  const handleFilterOrderChange = (position: number, newCriterionId: string) => {
    const newOrder = [...filterOrder];
    
    // If empty string selected, clear this position and all after it
    if (!newCriterionId) {
      for (let i = position; i < newOrder.length; i++) {
        newOrder[i] = '';
      }
    } else {
      // Find if this criterion is already in the order
      const existingIndex = newOrder.indexOf(newCriterionId);
      
      if (existingIndex !== -1 && existingIndex !== position) {
        // Swap positions
        [newOrder[position], newOrder[existingIndex]] = [newOrder[existingIndex], newOrder[position]];
      } else if (existingIndex === -1) {
        newOrder[position] = newCriterionId;
      }
    }
    
    setFilterOrder(newOrder);
    
    // Clear selections from this position onward
    const newSelections = { ...filterSelections };
    for (let i = position; i < newOrder.length; i++) {
      if (newOrder[i]) {
        delete newSelections[newOrder[i]];
      }
    }
    setFilterSelections(newSelections);
    
    // Clear options from next position onward
    const newOptions = { ...filterOptions };
    for (let i = position + 1; i < newOrder.length; i++) {
      if (newOrder[i]) {
        delete newOptions[newOrder[i]];
      }
    }
    setFilterOptions(newOptions);
  };

  const handleFilterSelection = (criterionId: string, value: string) => {
    console.log(`🎯 handleFilterSelection called:`, { criterionId, value, currentFilterSelections: filterSelections });
    
    const position = filterOrder.indexOf(criterionId);
    const newManuallySet = new Set(manuallySetFilters);
    
    // Update this selection
    const newSelections = { ...filterSelections };
    
    if (value) {
      newSelections[criterionId] = value;
      newManuallySet.add(criterionId); // Mark as manually set
      console.log(`✅ Setting filter: ${criterionId} = "${value}"`);
    } else {
      delete newSelections[criterionId];
      newManuallySet.delete(criterionId);
      console.log(`❌ Clearing filter: ${criterionId}`);
    }
    
    // Clear selections after this position
    for (let i = position + 1; i < filterOrder.length; i++) {
      delete newSelections[filterOrder[i]];
      newManuallySet.delete(filterOrder[i]);
    }
    
    console.log(`📝 New filterSelections:`, newSelections);
    setFilterSelections(newSelections);
    setManuallySetFilters(newManuallySet);
    setSelectedEngagement('');

    // Auto-populate next criterion if not already set
    if (position < filterOrder.length - 1 && !filterOrder[position + 1]) {
      const newOrder = [...filterOrder];
      
      // Get already selected criteria
      const selectedCriteria = newOrder.filter((id, idx) => idx <= position && id !== '');
      
      // Find next available criterion
      const availableCriteria = AVAILABLE_CRITERIA.filter(
        c => !selectedCriteria.includes(c.id)
      );
      
      if (availableCriteria.length > 0) {
        newOrder[position + 1] = availableCriteria[0].id;
        setFilterOrder(newOrder);
      }
    }
  };

  // Handle engagement selection - auto-populate filter values from engagement if not manually set
  const handleEngagementSelection = (engagementId: string) => {
    // Find the engagement item in sourceItems by ID
    const engagementItem = sourceItems.find(item => item.id === engagementId);
    if (!engagementItem) {
      console.warn('Engagement not found:', engagementId);
      return;
    }
    
    // Validate that the engagement matches current filter selections
    const selectedFilters = Object.entries(filterSelections).filter(([_, value]) => value !== '');
    if (selectedFilters.length > 0) {
      const filters = selectedFilters.map(([criterionId, value]) => {
        const criterion = AVAILABLE_CRITERIA.find(c => c.id === criterionId);
        return {
          columnId: criterion!.columnId,
          value: value
        };
      });
      
      // Check if engagement matches all current filters
      const matchesFilters = filters.every(filter => {
        const column = engagementItem.column_values?.find((c: any) => c.id === filter.columnId);
        if (!column) {
          return false;
        }
        // Compare text values (trim whitespace and handle case)
        const columnText = (column.text || '').trim();
        const filterValue = (filter.value || '').trim();
        return columnText === filterValue;
      });
      
      if (!matchesFilters) {
        console.warn('Selected engagement does not match current filters:', engagementName);
        // Don't allow selection if it doesn't match filters
        return;
      }
    }
    
    // Engagement is valid - set it as selected
    setSelectedEngagement(engagementId);
    
    // Auto-populate filter values from engagement if user hasn't manually set them
    const newSelections = { ...filterSelections };
    
    AVAILABLE_CRITERIA.forEach(criterion => {
      // Only auto-populate if user hasn't manually set this filter
      if (!manuallySetFilters.has(criterion.id)) {
        const column = engagementItem.column_values?.find((c: any) => c.id === criterion.columnId);
        if (column && column.text) {
          newSelections[criterion.id] = column.text;
        }
      }
    });
    
    setFilterSelections(newSelections);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    if (!validateEmail(email)) {
      setSubmitMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      setSubmitting(false);
      return;
    }

    try {
      const selectedEngagementDetails = engagementOptions.find(e => e.id === selectedEngagement);
      
      // Format dates with time for Monday.com
      // Monday expects UTC time but displays in user's timezone
      const now = new Date();
      
      // Get date in local timezone for the date field
      const submittedDate = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0'); // YYYY-MM-DD (local)
      
      // Get time in UTC for the time field (Monday will display in user's timezone)
      const submittedTime = String(now.getUTCHours()).padStart(2, '0') + ':' + 
        String(now.getUTCMinutes()).padStart(2, '0') + ':' + 
        String(now.getUTCSeconds()).padStart(2, '0'); // HH:MM:SS (UTC)
      
      // Build column values mapped to destination board
      const columnValues: Record<string, any> = {
        // User Information
        text_mkwrbr6p: requesterName,                    // Requester Name
        email_mkwr1ham: { email: email, text: email },   // Email (email column type)
        text_mkwr3hq0: department || '',                 // Department
        text_mkwrh03s: eventDuration,                    // Event Duration
        text_mkwrjgwf: requesterDescription,             // Requester Description
        
        // Engagement from source board
        text_mkwrmbrf: selectedEngagementDetails?.name,               // Engagement Name
        text_mkwrhk6d: selectedEngagementDetails?.description || '', // Engagement Description
        
        // Date Submitted (auto-filled with current date/time)
        date_mkwsfa4p: { 
          date: submittedDate, 
          time: submittedTime 
        },
      };

      // Add event date/time if provided
      if (eventDateTime) {
        const eventDateObj = new Date(eventDateTime);
        
        // Get date in local timezone
        const eventDate = eventDateObj.getFullYear() + '-' + 
          String(eventDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
          String(eventDateObj.getDate()).padStart(2, '0'); // YYYY-MM-DD (local)
        
        // Get time in UTC (Monday will display in user's timezone)
        const eventTime = String(eventDateObj.getUTCHours()).padStart(2, '0') + ':' + 
          String(eventDateObj.getUTCMinutes()).padStart(2, '0') + ':' + 
          String(eventDateObj.getUTCSeconds()).padStart(2, '0'); // HH:MM:SS (UTC)
        
        columnValues.date4 = { 
          date: eventDate,
          time: eventTime
        };
      }

      // Add filter values - use manually set values if available, otherwise get from engagement
      const engagementItem = sourceItems.find(item => item.id === selectedEngagement);
      
      // Helper function to get filter value (manual selection or from engagement)
      const getFilterValue = (criterionId: string, columnId: string): string | null => {
        // If user manually set this filter, use it
        if (manuallySetFilters.has(criterionId) && filterSelections[criterionId]) {
          return filterSelections[criterionId];
        }
        // Otherwise, get from engagement item in source board
        if (engagementItem) {
          const column = engagementItem.column_values?.find((c: any) => c.id === columnId);
          return column?.text || null;
        }
        return null;
      };
      
      const paCategory = getFilterValue('paCategory', 'color_mkvnrc08');
      const depth = getFilterValue('depth', 'color_mkvnyaj9');
      const typeRaw = getFilterValue('type', 'dropdown_mkvn675a');
      const type = normalizeTypeForDestination(typeRaw); // Normalize to match destination dropdown labels
      const audience = getFilterValue('audience', 'color_mkvnh5kw');

      if (paCategory) columnValues.color_mkwrzjh2 = { label: paCategory };  // Theme (status)
      if (depth) columnValues.color_mkwr6zfj = { label: depth };             // Depth (status)
      if (type) columnValues.dropdown_mkwr1011 = { labels: [type] };         // Type (dropdown) - normalized
      if (audience) columnValues.color_mkwr3jx0 = { label: audience };       // Audience (status)

      // Item name is the Event/Engagement Name
      const itemName = engagementName || `${requesterName} - ${selectedEngagement}`;

      // Debug: Log all values being sent to destination board
      console.log('🔍 VALUES BEING SENT TO DESTINATION BOARD:');
      console.log('Raw filter values:', {
        paCategory,
        depth,
        typeRaw,
        type,
        audience
      });
      console.log('Full columnValues object:', JSON.stringify(columnValues, null, 2));
      console.log('Item name:', itemName);

      const result = await mondayService.createItem(destinationBoardId, itemName, columnValues);

      setSubmitMessage({
        type: 'success',
        text: `Order submitted successfully! Request ID: ${result.id}`
      });

      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitMessage({
        type: 'error',
        text: `Error submitting order: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEngagementName('');
    setRequesterName('');
    setEmail('');
    setEmailError('');
    setDepartment('');
    setEventDateTime('');
    setEventDate('');
    setEventHour('');
    setEventMinute('');
    setEventDuration('');
    setRequesterDescription('');
    setFilterSelections({});
    setManuallySetFilters(new Set());
    setSelectedEngagement('');
    setSubmitMessage(null);
  };

  const isFormValid = () => {
    // Filters are optional, only require user info, date/time, and engagement selection
    return engagementName && requesterName && email && validateEmail(email) && 
           department && eventDate && eventHour && eventMinute && 
           eventDuration && selectedEngagement;
  };

  const selectedEngagementDetails = engagementOptions.find(e => e.id === selectedEngagement);

  return (
    <div className="flexible-filter-form">
      <h2>Engagement Request Form</h2>
      <p className="form-subtitle">Request engagements for your Museum event</p>

      <form onSubmit={handleSubmit}>
        {/* User Information Section */}
        <div className="form-section">
          <h3>Event & Requester Information</h3>
          
          <div className="form-field">
            <label htmlFor="engagementName">Event/Engagement Name *</label>
            <input
              id="engagementName"
              type="text"
              value={engagementName}
              onChange={(e) => setEngagementName(e.target.value)}
              placeholder="Name of your event or engagement"
              required
            />
            <small>This will be the title of the request</small>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="requesterName">Your Name *</label>
              <input
                id="requesterName"
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your.email@museum.org"
                className={emailError ? 'input-error' : ''}
                required
              />
              {emailError && <span className="error-text">{emailError}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="department">Department *</label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Your department"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="eventDate">Event Date & Time *</label>
              <div className="datetime-picker">
                <input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={getCurrentDate()}
                  required
                  className="date-input"
                />
                <select
                  value={eventHour}
                  onChange={(e) => setEventHour(e.target.value)}
                  required
                  className="time-select"
                >
                  <option value="">Hour</option>
                  {Array.from({ length: 16 }, (_, i) => i + 8).map(hour => (
                    <option key={hour} value={String(hour).padStart(2, '0')}>
                      {String(hour).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="time-separator">:</span>
                <select
                  value={eventMinute}
                  onChange={(e) => setEventMinute(e.target.value)}
                  required
                  className="time-select"
                >
                  <option value="">Min</option>
                  <option value="00">00</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="eventDuration">Event Duration *</label>
            <input
              id="eventDuration"
              type="text"
              value={eventDuration}
              onChange={(e) => setEventDuration(e.target.value)}
              placeholder="e.g., 2 hours, full day, 3 days"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="requesterDescription">Event Description</label>
            <textarea
              id="requesterDescription"
              value={requesterDescription}
              onChange={(e) => setRequesterDescription(e.target.value)}
              placeholder="Describe your event and any specific requirements or notes"
              rows={4}
            />
            <small>Provide details about your event to help us serve you better</small>
          </div>
        </div>

        {/* Flexible Filter Selection */}
        <div className="form-section">
          <h3>Filter By...</h3>

          {filterOrder.map((criterionId, position) => {
            const criterion = AVAILABLE_CRITERIA.find(c => c.id === criterionId);
            
            // Get available criteria for this position (exclude already selected ones)
            const selectedCriteria = filterOrder.filter((id, idx) => idx !== position && id !== '');
            const availableCriteriaForPosition = AVAILABLE_CRITERIA.filter(
              c => !selectedCriteria.includes(c.id)
            );

            const isPreviousSelected = position === 0 || (filterOrder[position - 1] && filterSelections[filterOrder[position - 1]]);
            const isPreviousCriterionChosen = position === 0 || filterOrder[position - 1] !== '';
            const hasOptions = criterion && filterOptions[criterionId] && filterOptions[criterionId].length > 0;
            const isLoading = criterion && loading[criterionId];

            // Disable if only one option (auto-selected) or if previous criterion not chosen
            const isDisabled = (!isPreviousCriterionChosen && position > 0) || 
                              (!!criterionId && availableCriteriaForPosition.length === 1);

            // Hide rows 3 and 4 (positions 2 and 3) until previous criterion is selected
            if (position >= 2 && !isPreviousCriterionChosen) {
              return null;
            }

            return (
              <div key={position} className="flexible-filter-row">
                <div className="filter-position">
                  <select
                    value={criterionId || ''}
                    onChange={(e) => handleFilterOrderChange(position, e.target.value)}
                    className="filter-order-select"
                    disabled={isDisabled}
                  >
                    <option value="">--</option>
                    {availableCriteriaForPosition.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-value">
                  {!criterionId ? (
                    <select disabled className="disabled-select">
                      <option>--</option>
                    </select>
                  ) : (
                    <>
                      {isLoading ? (
                        <div className="loading-select">Loading options...</div>
                      ) : !isPreviousSelected ? (
                        <select disabled className="disabled-select">
                          <option>Complete previous filter first</option>
                        </select>
                      ) : !hasOptions ? (
                        <div className="no-options">No options available</div>
                      ) : (
                        <select
                          value={filterSelections[criterionId] || ''}
                          onChange={(e) => handleFilterSelection(criterionId, e.target.value)}
                          className="filter-value-select"
                        >
                          <option value="">--</option>
                          {filterOptions[criterionId]?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Engagement Selection */}
          {engagementOptions.length > 0 && (
            <div className="form-field engagement-field">
              <select
                id="engagement"
                value={selectedEngagement}
                onChange={(e) => handleEngagementSelection(e.target.value)}
                required
              >
                <option value="">-- Select Engagement --</option>
                {engagementOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Engagement Description Preview */}
          {selectedEngagementDetails && (
            <div className="engagement-preview">
              <h4>Selected Engagement Details</h4>
              <div className="preview-content">
                <p><strong>Name:</strong> {selectedEngagementDetails.name}</p>
                <p><strong>Description:</strong></p>
                <div className="description-box">
                  {selectedEngagementDetails.description || 'No description available'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="button-secondary"
            disabled={submitting}
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={!isFormValid() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.type}`}>
            {submitMessage.text}
          </div>
        )}
      </form>
    </div>
  );
};

