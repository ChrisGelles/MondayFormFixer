import { useState, useEffect } from 'react';
import { initializeMondayService } from './services/mondayService';
import { ProjectAthenaForm } from './components/ProjectAthenaForm';
import './App.css';

function App() {
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form configuration
  const [sourceBoardId, setSourceBoardId] = useState('10021032653'); // Pre-filled
  const [destinationBoardId, setDestinationBoardId] = useState('');

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

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiToken('');
    localStorage.removeItem('monday_api_token');
    localStorage.removeItem('destination_board_id');
  };

  // Try to load saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('monday_api_token');
    const savedDestBoard = localStorage.getItem('destination_board_id');
    if (savedToken) {
      setApiToken(savedToken);
    }
    if (savedDestBoard) {
      setDestinationBoardId(savedDestBoard);
    }
  }, []);

  const isConfigured = sourceBoardId && destinationBoardId;

  if (!isConnected) {
    return (
      <div className="app">
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
    <div className="app">
      <div className="header">
        <h1>Monday Form Fixer</h1>
        <button onClick={handleDisconnect} className="disconnect-button">
          Disconnect
        </button>
      </div>

      <div className="config-panel">
        <h2>Project Athena Setup</h2>
        
        <div className="config-section">
          <h3>Board Configuration</h3>
          
          <div className="form-group">
            <label htmlFor="sourceBoardId">Source Board ID (Content Database)</label>
            <input
              id="sourceBoardId"
              type="text"
              value={sourceBoardId}
              onChange={(e) => setSourceBoardId(e.target.value)}
              placeholder="Board ID with PA content"
            />
            <small>Currently set to: 10021032653</small>
          </div>

          <div className="form-group">
            <label htmlFor="destinationBoardId">Destination Board ID (Order Form)</label>
            <input
              id="destinationBoardId"
              type="text"
              value={destinationBoardId}
              onChange={(e) => {
                setDestinationBoardId(e.target.value);
                localStorage.setItem('destination_board_id', e.target.value);
              }}
              placeholder="Board ID where orders will be created"
            />
          </div>
        </div>

        <div className="help-text">
          <h3>Setting up your Destination Board:</h3>
          <ol>
            <li>Create a new board in Monday.com called "Project Athena Orders" (or similar)</li>
            <li>Add these columns:
              <ul>
                <li><strong>Text columns:</strong> Name, Email, Department, Event Duration, Engagement Duration</li>
                <li><strong>Date column:</strong> Event Date/Time</li>
                <li><strong>Long Text columns:</strong> User Description, Content Description</li>
                <li><strong>Dropdown/Text:</strong> PA Category, Depth, Type, Audience, Engagement Name</li>
                <li><strong>Status column:</strong> Request Status</li>
              </ul>
            </li>
            <li>Copy the board ID from the URL and paste it above</li>
          </ol>
          <p><strong>Note:</strong> You may need to adjust column IDs in the ProjectAthenaForm.tsx file to match your board's structure.</p>
        </div>
      </div>

      {isConfigured && (
        <div className="form-container">
          <ProjectAthenaForm
            sourceBoardId={sourceBoardId}
            destinationBoardId={destinationBoardId}
          />
        </div>
      )}
    </div>
  );
}

export default App;
