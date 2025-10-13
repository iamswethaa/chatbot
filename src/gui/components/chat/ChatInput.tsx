import React, { useState, KeyboardEvent } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..." 
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-t border-app bg-panel">
      <div className="flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 border border-app rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-panel text-app"
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="flex items-center justify-center w-12 h-12 btn-bw rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        {disabled ? (
          <FiLoader className="w-5 h-5 animate-spin text-app-inverse" />
        ) : (
          <FiSend className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;