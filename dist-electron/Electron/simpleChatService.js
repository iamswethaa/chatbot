// Simplified chat service for Electron main process
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
export class SimpleChatService {
    groq;
    sessions = new Map();
    defaultModel = 'llama-3.1-8b-instant';
    defaultSystemPrompt = 'You are a helpful AI assistant. Be concise and friendly in your responses.';
    constructor(apiKey) {
        this.groq = new Groq({
            apiKey: apiKey,
        });
    }
    async initialize() {
        try {
            console.log('Testing Groq connection...');
            const modelsList = await this.groq.models.list();
            console.log('Available models:', modelsList.data.map(m => m.id));
            // Find the best chat model from available models
            const availableModels = modelsList.data.map(m => m.id);
            const preferredModels = [
                'llama-3.1-8b-instant',
                'llama-3.3-70b-versatile',
                'gemma2-9b-it',
                'mixtral-8x7b-32768'
            ];
            // Use the first preferred model that's available
            let selectedModel = this.defaultModel;
            for (const model of preferredModels) {
                if (availableModels.includes(model)) {
                    selectedModel = model;
                    break;
                }
            }
            this.defaultModel = selectedModel;
            console.log(`Using model: ${this.defaultModel}`);
            console.log('Chat service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize chat service:', error);
            throw error;
        }
    }
    createSession(userId) {
        const session = {
            id: uuidv4(),
            userId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.sessions.set(session.id, session);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    async sendMessage(message, sessionId, options = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const { model = this.defaultModel, temperature = 0.7, maxTokens = 1024, systemPrompt = this.defaultSystemPrompt } = options;
        // Create user message
        const userMessage = {
            id: this.generateId(),
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        session.messages.push(userMessage);
        try {
            // Prepare messages for Groq API
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                // Include recent chat history for context
                ...session.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];
            // Call Groq API
            console.log(`Sending message using model: ${model}`);
            const completion = await this.groq.chat.completions.create({
                messages,
                model,
                temperature,
                max_tokens: maxTokens,
                stream: false,
            });
            const responseContent = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
            // Create response message
            const responseMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date()
            };
            session.messages.push(responseMessage);
            session.updatedAt = new Date();
            return responseMessage;
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            throw new Error(`Failed to get response from chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    async testConnection() {
        try {
            await this.groq.models.list();
            return true;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    async getServiceStatus() {
        return {
            chatbot: await this.testConnection(),
            vectorDB: false, // Simplified version doesn't use vector DB
            embedding: false // Simplified version doesn't use embeddings
        };
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
