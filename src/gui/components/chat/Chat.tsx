import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import {
  ChatMessage as ChatMessageType,
  ChatSession,
  ServiceStatus,
  ChatOptions 
} from '../../../types/electron';

interface ChatProps {
  userId?: string;
  className?: string;
  options?: ChatOptions;
}

const Chat: React.FC<ChatProps> = ({ 
  userId, 
  className = '', 
  options = {} 
}) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typingMessage, setTypingMessage] = useState<ChatMessageType | undefined>();

  // Initialize chat session
  useEffect(() => {
    initializeSession();
    checkServiceStatus();
  }, [userId]);

  // Update messages when session changes
  useEffect(() => {
    if (session) {
      setMessages(session.messages);
    }
  }, [session]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if chat service is available
      const statusResult = await window.electronAPI.chat.getServiceStatus();
      if (!statusResult.success) {
        setError('Chat service is not available. Please check your API configuration.');
        return;
      }

      if (statusResult.data && !statusResult.data.chatbot) {
        setError('Chat service is not properly configured. Please check your GROQ_API_KEY in the environment file.');
        return;
      }

      const result = await window.electronAPI.chat.createSession(userId);
      
      if (result.success && result.data) {
        setSession(result.data);
        setMessages(result.data.messages);
      } else {
        setError(result.error || 'Failed to create chat session');
        toast.error(result.error || 'Failed to create chat session');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setError('Failed to initialize chat. Please check your internet connection and API keys.');
      toast.error('Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const result = await window.electronAPI.chat.getServiceStatus();
      if (result.success && result.data) {
        setServiceStatus(result.data);
      }
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  };

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!session || isLoading) {
      toast.error('Chat session not ready');
      return;
    }

    // Create and immediately add the user message to the chat
    const userMessage: ChatMessageType = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    try {
      setIsLoading(true);
      setIsTyping(true);

      // Update messages immediately to show user message
      setMessages(prev => [...prev, userMessage]);

      // Create a temporary typing message for assistant response
      const tempTypingMessage: ChatMessageType = {
        id: 'typing-' + Date.now(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setTypingMessage(tempTypingMessage);

      // Send message to backend
      const result = await window.electronAPI.chat.sendMessage(
        messageContent,
        session.id,
        {
          ...options,
          useVectorContext: true,
          storeInVector: true
        }
      );

      if (result.success && result.data) {
        // Update session with new messages from backend
        const updatedSession = await window.electronAPI.chat.getSession(session.id);
        if (updatedSession.success && updatedSession.data) {
          setSession(updatedSession.data);
          setMessages(updatedSession.data.messages);
        }
      } else {
        // If sending failed, remove the user message we added optimistically
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // If sending failed, remove the user message we added optimistically
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setTypingMessage(undefined);
    }
  }, [session, isLoading, options]);

  if (isLoading && !session) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600">Initializing chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      <ChatHeader 
        title="AI Assistant"
        serviceStatus={serviceStatus || undefined}
      />
      
      <ChatMessageList 
        messages={messages}
        isTyping={isTyping}
        typingMessage={typingMessage}
      />
      
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <span className="text-sm">⚠️</span>
            <span className="text-sm">{error}</span>
            <button 
              onClick={initializeSession}
              className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={isLoading || !serviceStatus?.chatbot || !!error}
        placeholder={
          error
            ? "Fix configuration to enable chat..."
            : !serviceStatus?.chatbot 
              ? "Chat service unavailable..." 
              : "Type your message..."
        }
      />
    </div>
  );
};

export default Chat;