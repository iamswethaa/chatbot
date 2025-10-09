export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useVectorContext?: boolean;
  storeInVector?: boolean;
  userId?: string;
}

export interface ServiceStatus {
  chatbot: boolean;
  vectorDB: boolean;
  embedding: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      saveConfigFiles: (files: Array<{ name: string; content: string }>) => Promise<any>;
      runFCTCommands: (speakerCount: number, ambientTemperature: number, storageType: string) => Promise<any>;
      clearConfigFolder: () => Promise<any>;
      
      chat: {
        createSession: (userId?: string) => Promise<{ success: boolean; data?: ChatSession; error?: string }>;
        sendMessage: (
          message: string, 
          sessionId: string, 
          options?: ChatOptions
        ) => Promise<{ success: boolean; data?: ChatMessage; error?: string }>;
        streamMessage: (
          message: string, 
          sessionId: string, 
          options?: ChatOptions
        ) => Promise<{ success: boolean; data?: string; error?: string }>;
        getSession: (sessionId: string) => Promise<{ success: boolean; data?: ChatSession; error?: string }>;
        deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
        getServiceStatus: () => Promise<{ success: boolean; data?: ServiceStatus; error?: string }>;
      };
    };
  }
}

export {};