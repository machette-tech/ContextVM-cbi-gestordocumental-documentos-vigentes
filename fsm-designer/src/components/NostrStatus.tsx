import { useNostr } from '../hooks/useNostr';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

export function NostrStatus() {
  const { status, publicKey, error, connect, disconnect, isConnected, isConnecting } = useNostr();

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="text-green-600" size={18} />;
      case 'connecting':
        return <Loader2 className="text-blue-600 animate-spin" size={18} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={18} />;
      default:
        return <WifiOff className="text-gray-400" size={18} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Error';
      default:
        return 'Desconectado';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {error && (
        <span className="text-sm text-red-600">
          {error}
        </span>
      )}

      {publicKey && isConnected && (
        <span className="text-xs text-gray-500 font-mono">
          {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
        </span>
      )}

      <div className="ml-auto">
        {isConnected ? (
          <button
            onClick={disconnect}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Conectando...' : 'Conectar Relay'}
          </button>
        )}
      </div>
    </div>
  );
}
