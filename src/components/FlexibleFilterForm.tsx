import { useState, useEffect } from 'react';
import { getMondayService } from '../services/mondayService';
import { getUniqueValuesFromColumn } from '../utils/mondayColumnHelper';
import './FlexibleFilterForm.css';

interface EngagementOption {
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
  { id: 'paCategory', label: 'PA Category', columnId: 'color_mkvnrc08' },
  { id: 'depth', label: 'Depth', columnId: 'color_mkvnyaj9' },
  { id: 'type', label: 'Type', columnId: 'dropdown_mkvn675a' },
  { id: 'audience', label: 'Audience', columnId: 'color_mkvnh5kw' },
];

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
  const [eventDuration, setEventDuration] = useState('');
  const [requesterDescription, setRequesterDescription] = useState('');

  // Filter order - only first position pre-populated with PA Category
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
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [emailError, setEmailError] = useState('');

  const mondayService = getMondayService();

  // Load source items
  useEffect(() => {
    const loadSourceItems = async () => {
      setLoading(prev => ({ ...prev, source: true }));
      try {
        const items = await mondayService.getBoardItems(sourceBoardId);
        setSourceItems(items);
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
        const values = await getUniqueValuesFromColumn(sourceBoardId, criterion.columnId);
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
  }, [sourceBoardId, filterOrder]);

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
          // Get all values for this criterion
          const allValues = await getUniqueValuesFromColumn(sourceBoardId, nextCriterion.columnId);
          
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
              return column && column.text === filter.value;
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

  // Load engagement options when all filters are selected
  useEffect(() => {
    // Only check non-empty criteria
    const definedCriteria = filterOrder.filter(id => id !== '');
    const allFiltersSelected = definedCriteria.length > 0 && definedCriteria.every(id => filterSelections[id]);
    
    if (allFiltersSelected && sourceItems.length > 0) {
      const filters = definedCriteria.map(criterionId => {
        const criterion = AVAILABLE_CRITERIA.find(c => c.id === criterionId);
        return {
          columnId: criterion!.columnId,
          value: filterSelections[criterionId]
        };
      });

      const filteredItems = sourceItems.filter(item => {
        return filters.every(filter => {
          const column = item.column_values?.find((c: any) => c.id === filter.columnId);
          return column && column.text === filter.value;
        });
      });

      const engagements = filteredItems.map(item => ({
        name: item.name || '',
        description: item.column_values?.find((c: any) => c.id === 'text_mkvnh9sm')?.text || '',
        columnValues: {}
      }));

      setEngagementOptions(engagements);
    } else {
      setEngagementOptions([]);
      setSelectedEngagement('');
    }
  }, [filterSelections, sourceItems, filterOrder]);

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
    const position = filterOrder.indexOf(criterionId);
    
    // Update this selection
    const newSelections = { ...filterSelections };
    newSelections[criterionId] = value;
    
    // Clear selections after this position
    for (let i = position + 1; i < filterOrder.length; i++) {
      delete newSelections[filterOrder[i]];
    }
    
    setFilterSelections(newSelections);
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
      const selectedEngagementDetails = engagementOptions.find(e => e.name === selectedEngagement);
      
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
        text_mkwrmbrf: selectedEngagement,               // Engagement Name
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

      // Add filter values based on their column types
      const paCategory = filterSelections['paCategory'];
      const depth = filterSelections['depth'];
      const type = filterSelections['type'];
      const audience = filterSelections['audience'];

      if (paCategory) columnValues.color_mkwrzjh2 = { label: paCategory };  // PA Category (status)
      if (depth) columnValues.color_mkwr6zfj = { label: depth };             // Depth (status)
      if (type) columnValues.dropdown_mkwr1011 = { labels: [type] };         // Type (dropdown)
      if (audience) columnValues.color_mkwr3jx0 = { label: audience };       // Audience (status)

      // Item name is the Event/Engagement Name
      const itemName = engagementName || `${requesterName} - ${selectedEngagement}`;

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
    setEventDuration('');
    setRequesterDescription('');
    setFilterSelections({});
    setSelectedEngagement('');
    setSubmitMessage(null);
  };

  const isFormValid = () => {
    return engagementName && requesterName && email && validateEmail(email) && 
           eventDateTime && eventDuration && selectedEngagement;
  };

  const selectedEngagementDetails = engagementOptions.find(e => e.name === selectedEngagement);

  return (
    <div className="flexible-filter-form">
      <h2>Project Athena Content Request</h2>
      <p className="form-subtitle">Order programming content for your museum event</p>

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
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Your department (optional)"
              />
              <small>Optional</small>
            </div>

            <div className="form-field">
              <label htmlFor="eventDateTime">Event Date & Time *</label>
              <input
                id="eventDateTime"
                type="datetime-local"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                required
              />
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
          <h3>Select Content Filters</h3>
          <p className="section-note">Choose your filter order, then select values to narrow down content</p>

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
                              (criterionId && availableCriteriaForPosition.length === 1);

            return (
              <div key={position} className="flexible-filter-row">
                <div className="filter-position">
                  <label>Filter {position + 1}</label>
                  <select
                    value={criterionId || ''}
                    onChange={(e) => handleFilterOrderChange(position, e.target.value)}
                    className="filter-order-select"
                    disabled={isDisabled}
                  >
                    <option value="">-- Select Criterion --</option>
                    {availableCriteriaForPosition.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-value">
                  {!criterionId ? (
                    <div className="disabled-select">
                      <label>Select criterion first</label>
                      <select disabled className="disabled-select">
                        <option>Choose a criterion above</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <label>Select {criterion?.label || 'Value'}</label>
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
                          <option value="">-- Select {criterion?.label} --</option>
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
              <label htmlFor="engagement">Engagement Name *</label>
              <select
                id="engagement"
                value={selectedEngagement}
                onChange={(e) => setSelectedEngagement(e.target.value)}
                required
              >
                <option value="">-- Select Engagement --</option>
                {engagementOptions.map(option => (
                  <option key={option.name} value={option.name}>{option.name}</option>
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

