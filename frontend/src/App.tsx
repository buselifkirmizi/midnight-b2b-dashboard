import { useState } from 'react';
import { connectLace, isLaceInstalled, type ConnectedAPI } from './midnight/lace-connector';
import './App.css';

function App() {
  const [lace, setLace] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConnect = async () => {
    setError('');
    setStatus('Connecting to Lace...');
    try {
      if (!isLaceInstalled()) {
        setError('Lace wallet not found. Please install the Lace browser extension.');
        setStatus('');
        return;
      }
      const connectedApi = await connectLace();
      const { unshieldedAddress } = await connectedApi.getUnshieldedAddress();
      setLace(connectedApi);
      setAddress(unshieldedAddress);
      setStatus('Connected');
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect to Lace');
      setStatus('');
    }
  };

  const handleDisconnect = () => {
    setLace(null);
    setAddress(null);
    setStatus('Disconnected');
  };

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Midnight B2B Agreement Dashboard</h1>
      <p>Privacy-first client agreement management on the Midnight network.</p>

      <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8, marginTop: 24 }}>
        <h2>Wallet</h2>
        {!lace ? (
          <button onClick={handleConnect}>Connect Lace Wallet</button>
        ) : (
          <div>
            <p>Connected address: <code>{address}</code></p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        )}
        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

export default App;
