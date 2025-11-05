import { useState, useEffect } from 'react';
import { initializeMondayService } from './services/mondayService';
import { FlexibleFilterForm } from './components/FlexibleFilterForm';
import './App.css';

function App() {
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleConnect = async () => {
    if (!apiToken) {
      setError('Please enter an API token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const service = initializeMondayService(apiToken);
      const connected = await service.testConnection();
      
      if (connected) {
        setIsConnected(true);
        // Save to localStorage for convenience
        localStorage.setItem('monday_api_token', apiToken);
        if (destinationBoardId) {
          localStorage.setItem('destination_board_id', destinationBoardId);
        }
      } else {
        setError('Failed to connect to Monday.com');
      }
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect handler - currently unused as config panel is hidden
  // const handleDisconnect = () => {
  //   setIsConnected(false);
  //   setApiToken('');
  //   localStorage.removeItem('monday_api_token');
  //   localStorage.removeItem('destination_board_id');
  // };

  // Try to load token from environment variable or localStorage on mount
  useEffect(() => {
    const envToken = import.meta.env.VITE_MONDAY_API_TOKEN;
    const envSourceBoard = import.meta.env.VITE_SOURCE_BOARD_ID;
    const envDestBoard = import.meta.env.VITE_DESTINATION_BOARD_ID;
    const savedToken = localStorage.getItem('monday_api_token');
    const savedDestBoard = localStorage.getItem('destination_board_id');
    
    // Use environment variable token if available (for production)
    if (envToken) {
      setApiToken(envToken);
      // Auto-connect with environment token
      initializeMondayService(envToken).testConnection()
        .then(connected => {
          if (connected) {
            setIsConnected(true);
          }
        })
        .catch(err => {
          console.error('Auto-connect failed:', err);
        });
    } else if (savedToken) {
      setApiToken(savedToken);
    }
    
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
  }, []);

  const isConfigured = sourceBoardId && destinationBoardId;

  if (!isConnected) {
    return (
      <div className="app" style={isTransparent ? { background: 'transparent' } : {}}>
        <div className="connection-panel">
          <h1>Monday Form Fixer</h1>
          <p>Connect to Monday.com to get started</p>
          
          <div className="form-group">
            <label htmlFor="apiToken">Monday API Token</label>
            <input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Monday API token"
              onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="connect-button"
          >
            {isLoading ? 'Connecting...' : 'Connect to Monday'}
          </button>

          <div className="help-text">
            <h3>How to get your API token:</h3>
            <ol>
              <li>Log in to your Monday.com account</li>
              <li>Click your profile picture (bottom left)</li>
              <li>Select "Developers"</li>
              <li>Click "My Access Tokens"</li>
              <li>Click "Show" next to your personal API token, or create a new one</li>
              <li>Copy the token and paste it above</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={isTransparent ? { background: 'transparent' } : {}}>
      {/* Configuration panel hidden - see README.md for setup instructions */}

      {isConfigured && (
        <div className="form-container">
          <FlexibleFilterForm
            sourceBoardId={sourceBoardId}
            destinationBoardId={destinationBoardId}
          />
        </div>
      )}
    </div>
  );
}

export default App;
