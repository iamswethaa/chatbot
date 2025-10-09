import Groq from 'groq-sdk';
export class ChatbotService {
    groq;
    defaultModel = 'llama-3.1-8b-instant';
    defaultSystemPrompt = 'You are a helpful AI assistant. Be concise and friendly in your responses.';
    constructor(apiKey) {
        this.groq = new Groq({
            apiKey: apiKey,
        });
    }
    /**
     * Send a message to the chatbot and get a response
     */
    async sendMessage(message, chatHistory = [], options = {}) {
        try {
            const { model = this.defaultModel, temperature = 0.7, maxTokens = 1024, systemPrompt = this.defaultSystemPrompt } = options;
            // Prepare messages for Groq API
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                // Include recent chat history for context
                ...chatHistory.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: message
                }
            ];
            // Call Groq API
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
            return responseMessage;
        }
        catch (error) {
            console.error('Error in ChatbotService.sendMessage:', error);
            throw new Error(`Failed to get response from chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Stream a response from the chatbot (for real-time typing effect)
     */
    async *streamMessage(message, chatHistory = [], options = {}) {
        try {
            const { model = this.defaultModel, temperature = 0.7, maxTokens = 1024, systemPrompt = this.defaultSystemPrompt } = options;
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...chatHistory.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: message
                }
            ];
            const stream = await this.groq.chat.completions.create({
                messages,
                model,
                temperature,
                max_tokens: maxTokens,
                stream: true,
            });
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    yield content;
                }
            }
        }
        catch (error) {
            console.error('Error in ChatbotService.streamMessage:', error);
            throw new Error(`Failed to stream response from chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get available models
     */
    async getAvailableModels() {
        try {
            const models = await this.groq.models.list();
            return models.data.map(model => model.id);
        }
        catch (error) {
            console.error('Error fetching models:', error);
            return [this.defaultModel]; // Return default model as fallback
        }
    }
    /**
     * Generate unique ID for messages
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    /**
     * Create a user message object
     */
    createUserMessage(content) {
        return {
            id: this.generateId(),
            role: 'user',
            content,
            timestamp: new Date()
        };
    }
    /**
     * Create an assistant message object
     */
    createAssistantMessage(content) {
        return {
            id: this.generateId(),
            role: 'assistant',
            content,
            timestamp: new Date()
        };
    }
    /**
     * Validate API connection
     */
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
}
