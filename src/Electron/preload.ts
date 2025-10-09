import { contextBridge, ipcRenderer } from "electron";

// Define types for chat functionality
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

contextBridge.exposeInMainWorld("electronAPI", {
  saveConfigFiles: async (files: Array<{ name: string; content: string }>) => {
    return await ipcRenderer.invoke("save-config-files", files);
  },

  runFCTCommands: async (speakerCount: number, ambientTemperature: number, storageType: string) => {
    return await ipcRenderer.invoke("run-fct-commands", speakerCount, ambientTemperature, storageType);
  },

  clearConfigFolder: async () => {
    return await ipcRenderer.invoke("clear-config-folder");
  },

  // Chat functionality
  chat: {
    createSession: async (userId?: string): Promise<{ success: boolean; data?: ChatSession; error?: string }> => {
      return await ipcRenderer.invoke("chat:create-session", userId);
    },

    sendMessage: async (
      message: string, 
      sessionId: string, 
      options?: ChatOptions
    ): Promise<{ success: boolean; data?: ChatMessage; error?: string }> => {
      return await ipcRenderer.invoke("chat:send-message", message, sessionId, options);
    },

    streamMessage: async (
      message: string, 
      sessionId: string, 
      options?: ChatOptions
    ): Promise<{ success: boolean; data?: string; error?: string }> => {
      return await ipcRenderer.invoke("chat:stream-message", message, sessionId, options);
    },

    getSession: async (sessionId: string): Promise<{ success: boolean; data?: ChatSession; error?: string }> => {
      return await ipcRenderer.invoke("chat:get-session", sessionId);
    },

    deleteSession: async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
      return await ipcRenderer.invoke("chat:delete-session", sessionId);
    },

    getServiceStatus: async (): Promise<{ success: boolean; data?: ServiceStatus; error?: string }> => {
      return await ipcRenderer.invoke("chat:get-service-status");
    }
  }
});
