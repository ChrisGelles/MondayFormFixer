import { useState, useEffect } from 'react';
import { getMondayService } from '../services/mondayService';
import { getUniqueValuesFromColumn } from '../utils/mondayColumnHelper';
import './ProjectAthenaForm.css';

interface EngagementOption {
  name: string;
  description: string;
  columnValues: Record<string, string>;
}

interface ProjectAthenaFormProps {
  sourceBoardId: string;
  destinationBoardId: string;
}

export const ProjectAthenaForm: React.FC<ProjectAthenaFormProps> = ({
  sourceBoardId,
  destinationBoardId
}) => {
  // User input fields
  const [engagementName, setEngagementName] = useState(''); // The Event/Engagement Name
  const [requesterName, setRequesterName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [requesterDescription, setRequesterDescription] = useState('');

  // Cascading selections
  const [paCategory, setPaCategory] = useState('');
  const [depth, setDepth] = useState('');
  const [type, setType] = useState('');
  const [audience, setAudience] = useState('');
  const [selectedEngagement, setSelectedEngagement] = useState('');

  // Options for dropdowns
  const [paCategoryOptions, setPaCategoryOptions] = useState<string[]>([]);
  const [depthOptions, setDepthOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [audienceOptions, setAudienceOptions] = useState<string[]>([]);
  const [engagementOptions, setEngagementOptions] = useState<EngagementOption[]>([]);

  // Loading states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [emailError, setEmailError] = useState('');

  // All source board items
  const [sourceItems, setSourceItems] = useState<any[]>([]);

  const mondayService = getMondayService();

  // Column IDs - these should match your Monday board
  const COLUMN_IDS = {
    paCategory: 'color_mkvnrc08',  // Status column
    depth: 'text0',                // Update these as needed
    type: 'text1',
    audience: 'text2',
    engagementName: 'name',        // Item name
    description: 'long_text'       // Long text column
  };

  // Load all items from source board on mount
  useEffect(() => {
    loadSourceItems();
  }, [sourceBoardId]);

  // Load initial PA Category options
  useEffect(() => {
    const loadPACategoryOptions = async () => {
      setLoading(prev => ({ ...prev, paCategory: true }));
      try {
        // Use the helper that handles different column types (status, dropdown, text)
        const values = await getUniqueValuesFromColumn(sourceBoardId, COLUMN_IDS.paCategory);
        setPaCategoryOptions(values);
      } catch (error) {
        console.error('Error loading PA Category options:', error);
        setPaCategoryOptions([]);
      } finally {
        setLoading(prev => ({ ...prev, paCategory: false }));
      }
    };

    if (sourceBoardId) {
      loadPACategoryOptions();
    }
  }, [sourceBoardId]);

  // Load filtered options when selections change
  useEffect(() => {
    if (paCategory) {
      const depths = getFilteredValues('depth', [{ field: 'paCategory', value: paCategory }]);
      setDepthOptions(depths);
      // Reset subsequent selections
      setDepth('');
      setType('');
      setAudience('');
      setSelectedEngagement('');
    }
  }, [paCategory]);

  useEffect(() => {
    if (depth) {
      const types = getFilteredValues('type', [
        { field: 'paCategory', value: paCategory },
        { field: 'depth', value: depth }
      ]);
      setTypeOptions(types);
      setType('');
      setAudience('');
      setSelectedEngagement('');
    }
  }, [depth]);

  useEffect(() => {
    if (type) {
      const audiences = getFilteredValues('audience', [
        { field: 'paCategory', value: paCategory },
        { field: 'depth', value: depth },
        { field: 'type', value: type }
      ]);
      setAudienceOptions(audiences);
      setAudience('');
      setSelectedEngagement('');
    }
  }, [type]);

  useEffect(() => {
    if (audience) {
      const engagements = getFilteredEngagements([
        { field: 'paCategory', value: paCategory },
        { field: 'depth', value: depth },
        { field: 'type', value: type },
        { field: 'audience', value: audience }
      ]);
      setEngagementOptions(engagements);
      setSelectedEngagement('');
    }
  }, [audience]);

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

  const getColumnValue = (item: any, fieldName: string): string => {
    const columnId = COLUMN_IDS[fieldName as keyof typeof COLUMN_IDS];
    
    if (fieldName === 'engagementName') {
      return item.name || '';
    }
    
    const column = item.column_values?.find((col: any) => col.id === columnId);
    return column?.text || '';
  };

  const getUniqueValues = (fieldName: string): string[] => {
    const values = new Set<string>();
    sourceItems.forEach(item => {
      const value = getColumnValue(item, fieldName);
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  const getFilteredValues = (
    targetField: string,
    filters: { field: string; value: string }[]
  ): string[] => {
    const filteredItems = sourceItems.filter(item => {
      return filters.every(filter => {
        return getColumnValue(item, filter.field) === filter.value;
      });
    });

    const values = new Set<string>();
    filteredItems.forEach(item => {
      const value = getColumnValue(item, targetField);
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  const getFilteredEngagements = (
    filters: { field: string; value: string }[]
  ): EngagementOption[] => {
    const filteredItems = sourceItems.filter(item => {
      return filters.every(filter => {
        return getColumnValue(item, filter.field) === filter.value;
      });
    });

    return filteredItems.map(item => ({
      name: item.name || '',
      description: getColumnValue(item, 'description'),
      columnValues: {
        paCategory: getColumnValue(item, 'paCategory'),
        depth: getColumnValue(item, 'depth'),
        type: getColumnValue(item, 'type'),
        audience: getColumnValue(item, 'audience')
      }
    }));
  };

  const getSelectedEngagementDetails = (): EngagementOption | null => {
    return engagementOptions.find(e => e.name === selectedEngagement) || null;
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

    // Validate email before submitting
    if (!validateEmail(email)) {
      setSubmitMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      setSubmitting(false);
      return;
    }

    try {
      const engagementDetails = getSelectedEngagementDetails();
      
      // Format date for Monday (ISO format date portion only)
      let formattedDate = '';
      if (eventDateTime) {
        const dateObj = new Date(eventDateTime);
        formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      
      // Prepare column values for Monday
      const columnValues: Record<string, any> = {
        // User info
        text: requesterName,           // Requester Name
        text0: email,                  // Email
        text1: department || '',       // Department (optional)
        text2: eventDuration,          // Event Duration
        text3: requesterDescription,   // Requester Description
        // Content selections - PA Category is a status column
        color_mkvnrc08: { label: paCategory },  // PA Category (status column format)
        text4: depth,                  // Depth
        text5: type,                   // Type
        text6: audience,               // Audience
        text7: selectedEngagement,     // Engagement Name
        long_text: engagementDetails?.description || '', // Engagement Description
        // Status
        status: { label: 'New Request' }
      };

      // Add date if provided
      if (formattedDate) {
        columnValues.date = { date: formattedDate };
      }

      // Item name is the Event/Engagement Name provided by requester
      const itemName = engagementName || `${requesterName} - ${selectedEngagement}`;

      const result = await mondayService.createItem(
        destinationBoardId,
        itemName,
        columnValues
      );

      setSubmitMessage({
        type: 'success',
        text: `Order submitted successfully! Request ID: ${result.id}`
      });

      // Reset form after 3 seconds
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
    setPaCategory('');
    setDepth('');
    setType('');
    setAudience('');
    setSelectedEngagement('');
    setSubmitMessage(null);
  };

  const isFormValid = () => {
    return engagementName && requesterName && email && validateEmail(email) && 
           eventDateTime && eventDuration && selectedEngagement;
  };

  const selectedEngagementDetails = getSelectedEngagementDetails();

  return (
    <div className="project-athena-form">
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

        {/* Content Selection Section */}
        <div className="form-section">
          <h3>Select Content</h3>
          <p className="section-note">Choose filters to narrow down available content</p>

          <div className="form-field">
            <label htmlFor="paCategory">PA Category *</label>
            <select
              id="paCategory"
              value={paCategory}
              onChange={(e) => setPaCategory(e.target.value)}
              required
            >
              <option value="">-- Select Category --</option>
              {paCategoryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="depth">Depth *</label>
            <select
              id="depth"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              disabled={!paCategory}
              required
            >
              <option value="">-- Select Depth --</option>
              {depthOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!depth}
              required
            >
              <option value="">-- Select Type --</option>
              {typeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="audience">Audience *</label>
            <select
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={!type}
              required
            >
              <option value="">-- Select Audience --</option>
              {audienceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="engagement">Engagement Name *</label>
            <select
              id="engagement"
              value={selectedEngagement}
              onChange={(e) => setSelectedEngagement(e.target.value)}
              disabled={!audience || engagementOptions.length === 0}
              required
            >
              <option value="">-- Select Engagement --</option>
              {engagementOptions.map(option => (
                <option key={option.name} value={option.name}>{option.name}</option>
              ))}
            </select>
            {audience && engagementOptions.length === 0 && (
              <p className="no-results">No engagements match your criteria</p>
            )}
          </div>

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

