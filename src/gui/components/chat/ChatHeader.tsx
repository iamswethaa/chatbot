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
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          <FiMessageCircle className="w-5 h-5 text-blue-600" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <FiWifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <FiWifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
            
            {serviceStatus && (
              <div className="flex space-x-1 ml-2">
                <div className={`w-2 h-2 rounded-full ${serviceStatus.chatbot ? 'bg-green-400' : 'bg-red-400'}`} 
                     title={`Chatbot: ${serviceStatus.chatbot ? 'Online' : 'Offline'}`} />
                <div className={`w-2 h-2 rounded-full ${serviceStatus.vectorDB ? 'bg-green-400' : 'bg-gray-400'}`} 
                     title={`Vector DB: ${serviceStatus.vectorDB ? 'Connected' : 'Disconnected'}`} />
                <div className={`w-2 h-2 rounded-full ${serviceStatus.embedding ? 'bg-green-400' : 'bg-gray-400'}`} 
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