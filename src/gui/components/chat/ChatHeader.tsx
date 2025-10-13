import React from 'react';
import { FiMessageCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { ServiceStatus } from '../../../types/electron';

interface ChatHeaderProps {
  title?: string;
  serviceStatus?: ServiceStatus;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title = "AI Assistant", 
  serviceStatus
}) => {
  const isConnected = serviceStatus?.chatbot;

  return (
    <div className="flex items-center justify-between p-4 bg-panel border-b border-app">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
          <FiMessageCircle className="w-5 h-5 text-app" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-app">{title}</h2>
          <div className="flex items-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <FiWifi className="w-4 h-4 text-app" />
                <span className="text-app-muted">Connected</span>
              </>
            ) : (
              <>
                <FiWifiOff className="w-4 h-4 text-app-muted" />
                <span className="text-app-muted">Disconnected</span>
              </>
            )}
            
            {serviceStatus && (
              <div className="flex space-x-1 ml-2">
                <div className={`w-2 h-2 rounded-full ${serviceStatus.chatbot ? 'bg-app' : 'bg-app-muted'}`} 
                     title={`Chatbot: ${serviceStatus.chatbot ? 'Online' : 'Offline'}`} />
                <div className={`w-2 h-2 rounded-full ${serviceStatus.vectorDB ? 'bg-app' : 'bg-app-muted'}`} 
                     title={`Vector DB: ${serviceStatus.vectorDB ? 'Connected' : 'Disconnected'}`} />
                <div className={`w-2 h-2 rounded-full ${serviceStatus.embedding ? 'bg-app' : 'bg-app-muted'}`} 
                     title={`Embeddings: ${serviceStatus.embedding ? 'Available' : 'Unavailable'}`} />
              </div>
            )}
          </div>
        </div>
        </div>

      
    </div>
  );
};

export default ChatHeader;