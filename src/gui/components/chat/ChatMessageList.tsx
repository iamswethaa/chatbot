import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../../../types/electron';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isTyping?: boolean;
  typingMessage?: ChatMessageType;
  messageDarkMode?: 'none' | 'sent' | 'received';
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages, 
  isTyping = false, 
  typingMessage 
  , messageDarkMode = 'none'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🤖</div>
            <div className="text-lg font-medium">Start a conversation</div>
            <div className="text-sm">Ask me anything!</div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} messageDarkMode={messageDarkMode} />
          ))}
          
          {isTyping && typingMessage && (
            <ChatMessage message={typingMessage} isTyping={true} messageDarkMode={messageDarkMode} />
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;