import { useState, useEffect } from 'react';
import { getMondayService } from '../services/mondayService';
import './CascadingForm.css';

interface FormConfig {
  sourceBoardId: string;
  destinationBoardId: string;
  cascadeSteps: {
    id: string;
    label: string;
    columnId: string;
  }[];
}

interface CascadingFormProps {
  config: FormConfig;
}

export const CascadingForm: React.FC<CascadingFormProps> = ({ config }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const mondayService = getMondayService();

  // Load options for the first dropdown on mount
  useEffect(() => {
    if (config.cascadeSteps.length > 0) {
      loadOptionsForStep(0);
    }
  }, [config]);

  // Load options when previous selection changes
  useEffect(() => {
    const currentStepIndex = Object.keys(selections).length;
    
    if (currentStepIndex > 0 && currentStepIndex < config.cascadeSteps.length) {
      loadOptionsForStep(currentStepIndex);
    }
  }, [selections]);

  const loadOptionsForStep = async (stepIndex: number) => {
    const step = config.cascadeSteps[stepIndex];
    
    setLoading(prev => ({ ...prev, [step.id]: true }));

    try {
      let values: string[];

      if (stepIndex === 0) {
        // First dropdown - get all unique values
        values = await mondayService.getUniqueColumnValues(
          config.sourceBoardId,
          step.columnId
        );
      } else {
        // Subsequent dropdowns - filter based on previous selections
        const filters = config.cascadeSteps
          .slice(0, stepIndex)
          .map(prevStep => ({
            columnId: prevStep.columnId,
            value: selections[prevStep.id]
          }));

        values = await mondayService.getFilteredColumnValues(
          config.sourceBoardId,
          step.columnId,
          filters
        );
      }

      setOptions(prev => ({ ...prev, [step.id]: values }));
    } catch (error) {
      console.error(`Error loading options for ${step.label}:`, error);
      setOptions(prev => ({ ...prev, [step.id]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [step.id]: false }));
    }
  };

  const handleSelection = (stepId: string, value: string) => {
    const stepIndex = config.cascadeSteps.findIndex(s => s.id === stepId);
    
    // Update the selection
    const newSelections: Record<string, string> = {};
    
    // Keep all selections up to and including this step
    for (let i = 0; i <= stepIndex; i++) {
      const step = config.cascadeSteps[i];
      newSelections[step.id] = i === stepIndex ? value : selections[step.id];
    }
    
    setSelections(newSelections);

    // Clear options for all subsequent steps
    const newOptions = { ...options };
    for (let i = stepIndex + 1; i < config.cascadeSteps.length; i++) {
      delete newOptions[config.cascadeSteps[i].id];
    }
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      // Prepare column values for the new item
      const columnValues: Record<string, any> = {};
      
      config.cascadeSteps.forEach(step => {
        if (selections[step.id]) {
          // For text columns, just set the value directly
          columnValues[step.columnId] = selections[step.id];
        }
      });

      // Create item name from selections
      const itemName = config.cascadeSteps
        .map(step => selections[step.id])
        .filter(Boolean)
        .join(' - ');

      // Create the item
      const result = await mondayService.createItem(
        config.destinationBoardId,
        itemName,
        columnValues
      );

      setSubmitMessage({
        type: 'success',
        text: `Successfully created item: ${result.name}`
      });

      // Reset form after successful submission
      setTimeout(() => {
        setSelections({});
        setOptions({});
        setSubmitMessage(null);
        loadOptionsForStep(0);
      }, 2000);

    } catch (error) {
      console.error('Error creating item:', error);
      setSubmitMessage({
        type: 'error',
        text: `Error creating item: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormComplete = config.cascadeSteps.every(step => selections[step.id]);

  return (
    <div className="cascading-form">
      <h2>Select Options</h2>
      
      <div className="form-steps">
        {config.cascadeSteps.map((step, index) => {
          const isPreviousStepComplete = index === 0 || selections[config.cascadeSteps[index - 1].id];
          const hasOptions = options[step.id] && options[step.id].length > 0;
          const isLoading = loading[step.id];

          return (
            <div key={step.id} className="form-step">
              <label htmlFor={step.id}>{step.label}</label>
              
              {isLoading ? (
                <div className="loading">Loading options...</div>
              ) : !isPreviousStepComplete ? (
                <select disabled className="disabled-select">
                  <option>Please complete previous step</option>
                </select>
              ) : !hasOptions ? (
                <div className="no-options">No options available</div>
              ) : (
                <select
                  id={step.id}
                  value={selections[step.id] || ''}
                  onChange={(e) => handleSelection(step.id, e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select {step.label} --</option>
                  {options[step.id]?.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete || submitting}
          className="submit-button"
        >
          {submitting ? 'Creating...' : 'Create Item'}
        </button>
      </div>

      {submitMessage && (
        <div className={`submit-message ${submitMessage.type}`}>
          {submitMessage.text}
        </div>
      )}
    </div>
  );
};

