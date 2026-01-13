import { useState, useEffect } from 'react';
import { initializeMondayService } from './services/mondayService';
import { FlexibleFilterForm } from './components/FlexibleFilterForm';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form configuration
  const [sourceBoardId, setSourceBoardId] = useState('');
  const [destinationBoardId, setDestinationBoardId] = useState('');
  
  // Check for transparent parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isTransparent = urlParams.get('transparent') === 'true';

  // Send height updates to parent window for iframe auto-resizing
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    // Send initial height
    sendHeight();

    // Send height on window resize
    window.addEventListener('resize', sendHeight);

    // Observe DOM changes and send height updates
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return () => {
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, []);

  // Auto-load credentials and connect on mount
  useEffect(() => {
    const connectToMonday = async () => {
      setIsLoading(true);
      setError('');

      const envSourceBoard = import.meta.env.VITE_SOURCE_BOARD_ID;
      const envDestBoard = import.meta.env.VITE_DESTINATION_BOARD_ID;
      const savedDestBoard = localStorage.getItem('destination_board_id');
      
      // Use environment variable for source board ID if available
      if (envSourceBoard) {
        setSourceBoardId(envSourceBoard);
      } else {
        // Default to the current Project Athena board
        setSourceBoardId('10021032653');
      }
      
      // Use environment variable for destination board ID if available
      if (envDestBoard) {
        setDestinationBoardId(envDestBoard);
      } else if (savedDestBoard) {
        setDestinationBoardId(savedDestBoard);
      }

      try {
        // Initialize service (no API token needed - handled server-side)
        const service = initializeMondayService();
        const connected = await service.testConnection();
        
        if (connected) {
          setIsConnected(true);
          setError(''); // Clear any previous errors
        } else {
          setError('Failed to connect to Monday.com. Please check that MONDAY_API_TOKEN is set in Vercel environment variables.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        // Provide helpful error message if it's about missing token
        if (errorMessage.includes('token') || errorMessage.includes('MONDAY_API_TOKEN')) {
          setError('Monday.com API token not configured on server. Please set MONDAY_API_TOKEN in Vercel environment variables.');
        } else {
          setError(`Connection error: ${errorMessage}. Form will be displayed but submissions will be disabled.`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    connectToMonday();
  }, []);

  const isConfigured = sourceBoardId && destinationBoardId;

  // Show loading state
  if (isLoading) {
    return (
      <div className="app" style={isTransparent ? { background: 'transparent' } : {}}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Connecting to Monday.com...</p>
        </div>
      </div>
    );
  }

  // Always show the form, even if credentials aren't configured
  // The form component will handle disabled state
  return (
    <div className="app" style={isTransparent ? { background: 'transparent' } : {}}>
      {error && (
        <div className="error-banner">
          <div className="error-message">{error}</div>
        </div>
      )}
      {isConfigured && (
        <div className="form-container">
          <FlexibleFilterForm
            sourceBoardId={sourceBoardId}
            destinationBoardId={destinationBoardId}
            isEnabled={isConnected && isConfigured}
          />
        </div>
      )}
    </div>
  );
}

export default App;
