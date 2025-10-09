import { app, BrowserWindow, ipcMain, Menu } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { IntegratedChatService } from "../services/integratedChatService.js";
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize chat service
let chatService = null;
async function initializeChatService() {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        const pineconeApiKey = process.env.PINECONE_API_KEY;
        const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
        if (!groqApiKey) {
            console.error('GROQ_API_KEY is missing from environment variables');
            return; // Continue without chat service but don't throw
        }
        console.log('Initializing integrated chat service with local embeddings...');
        console.log('Groq API Key present:', !!groqApiKey);
        console.log('Pinecone API Key present:', !!pineconeApiKey);
        console.log('Pinecone Index Name present:', !!pineconeIndexName);
        chatService = new IntegratedChatService(groqApiKey, pineconeApiKey, pineconeIndexName);
        await chatService.initialize();
        console.log('Integrated chat service initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize chat service:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        // Continue without chat service instead of crashing
        chatService = null;
    }
}
function createWindow() {
    const win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            devTools: true,
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.loadURL("http://localhost:5173");
}
// IPC Handlers for chatbot functionality
ipcMain.handle('chat:create-session', async (_event, userId) => {
    try {
        if (!chatService) {
            throw new Error('Chat service not available');
        }
        const session = chatService.createSession(userId);
        return { success: true, data: session };
    }
    catch (error) {
        console.error('Error creating chat session:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
ipcMain.handle('chat:send-message', async (_event, message, sessionId, options = {}) => {
    try {
        if (!chatService) {
            throw new Error('Chat service not available');
        }
        const response = await chatService.sendMessage(message, sessionId, options);
        return { success: true, data: response };
    }
    catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
ipcMain.handle('chat:get-session', async (_event, sessionId) => {
    try {
        if (!chatService) {
            throw new Error('Chat service not available');
        }
        const session = chatService.getSession(sessionId);
        return { success: true, data: session };
    }
    catch (error) {
        console.error('Error getting session:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
ipcMain.handle('chat:delete-session', async (_event, sessionId) => {
    try {
        if (!chatService) {
            throw new Error('Chat service not available');
        }
        await chatService.deleteSession(sessionId);
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting session:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
ipcMain.handle('chat:get-service-status', async () => {
    try {
        if (!chatService) {
            return { success: true, data: { chatbot: false, vectorDB: false, embedding: false } };
        }
        const status = await chatService.getServiceStatus();
        return { success: true, data: status };
    }
    catch (error) {
        console.error('Error getting service status:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
// Handle streaming messages (simplified - just return regular message for now)
ipcMain.handle('chat:stream-message', async (_event, message, sessionId, options = {}) => {
    try {
        if (!chatService) {
            throw new Error('Chat service not available');
        }
        // For simplified version, just return the regular sendMessage result
        const response = await chatService.sendMessage(message, sessionId, options);
        return { success: true, data: response.content };
    }
    catch (error) {
        console.error('Error streaming message:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
Menu.setApplicationMenu(null);
app.whenReady().then(async () => {
    await initializeChatService();
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
