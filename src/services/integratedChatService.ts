import { ChatbotService, ChatMessage, ChatOptions } from './chatbotService.js';
import { VectorDatabaseService } from './vectorDatabaseService.js';
import { LocalEmbeddingService } from '../Electron/localEmbeddingService.js';
import { SimpleDocumentProcessingService } from './simpleDocumentProcessingService.js';
import { v4 as uuidv4 } from 'uuid';

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegratedChatOptions extends ChatOptions {
  sessionId?: string;
  userId?: string;
}

export class IntegratedChatService {
  private chatbotService: ChatbotService;
  private vectorService?: VectorDatabaseService;
  private embeddingService: LocalEmbeddingService;
  private documentService?: SimpleDocumentProcessingService;
  private sessions: Map<string, ChatSession> = new Map();

  // Template responses
  private readonly greetingResponses = [
    "Hi, How can I help you?",
    "Hello! How can I assist you today?",
    "Hi there! What can I help you with?",
    "Hey! Do you need any help?"
  ];

  private readonly thankYouResponse = "You're welcome!";
  
  private readonly irrelevantQueryResponse = "Sorry, I can only help you with this application. Please ask any queries related to the application.";

  // Common greeting patterns
  private readonly greetingPatterns = [
    /^(hi|hai|hello|hey|good\s+morning|good\s+afternoon|good\s+evening)/i,
    /^\s*(hi|hai|hello|hey)\s*$/i
  ];

  // Thank you patterns
  private readonly thankYouPatterns = [
    /thank\s*you/i,
    /thanks/i,
    /good job/i,
    /well done/i,
    /super/i,
    /great/i,
    /appreciate/i
  ];

  constructor(
    groqApiKey: string,
    pineconeApiKey?: string,
    pineconeIndexName?: string
  ) {
    this.chatbotService = new ChatbotService(groqApiKey);
        this.embeddingService = new LocalEmbeddingService();
    
    if (pineconeApiKey && pineconeIndexName) {
      this.vectorService = new VectorDatabaseService(pineconeApiKey, pineconeIndexName);
      // Use simple document service for text files
      this.documentService = new SimpleDocumentProcessingService(pineconeApiKey, pineconeIndexName);
    }
  }

  /**
   * Initialize the integrated chat service
   */
  async initialize(): Promise<void> {
    try {
      console.log('Testing chatbot connection...');
      // Test chatbot connection
      const chatbotConnected = await this.chatbotService.testConnection();
      if (!chatbotConnected) {
        throw new Error('Failed to connect to Groq API - check your GROQ_API_KEY');
      }
      console.log('Chatbot connection successful');

      // Initialize vector database if available
      if (this.vectorService) {
        try {
          console.log('Initializing vector database...');
          await this.vectorService.initializeIndex();
          const vectorConnected = await this.vectorService.testConnection();
          if (!vectorConnected) {
            console.warn('Vector database connection failed, continuing without vector features');
            this.vectorService = undefined;
            this.documentService = undefined;
          } else {
            console.log('Vector database connection successful');
          }
        } catch (vectorError) {
          console.warn('Vector database initialization failed:', vectorError);
          console.warn('Continuing without vector features');
          this.vectorService = undefined;
          this.documentService = undefined;
        }
      } else {
        console.log('Vector database not configured (optional)');
      }

      // Test embedding service
      console.log('Testing embedding service...');
      const embeddingWorking = await this.embeddingService.testEmbedding();
      if (!embeddingWorking) {
        console.warn('Embedding service test failed, but continuing...');
      } else {
        console.log('Embedding service working');
      }

      // Check if documents are already processed in the database
      if (this.vectorService) {
        try {
          console.log('Checking vector database status...');
          const stats = await this.vectorService.getIndexStats();
          const vectorCount = stats.totalVectorCount || 0;
          
          if (vectorCount > 0) {
            console.log(`✅ Database ready with ${vectorCount} vectors`);
          } else {
            console.log('⚠️  Database is empty. Please run document processing first:');
            console.log('   npm run process-docs');
          }
        } catch (error) {
          console.warn('Could not check database status:', error);
          console.log('ℹ️  To populate the database, run: npm run process-docs');
        }
      } else {
        console.log('ℹ️  Vector database not available. Some features will be limited.');
      }

      console.log('Integrated chat service initialized successfully');
    } catch (error) {
      console.error('Error initializing integrated chat service:', error);
      throw error;
    }
  }

  /**
   * Process documents manually
   */
  async processDocuments(): Promise<void> {
    if (!this.documentService) {
      throw new Error('Document processing service not available. Check your Pinecone configuration.');
    }
    await this.documentService.processAllDocuments();
  }

  /**
   * Create a new chat session
   */
  createSession(userId?: string): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    return this.greetingPatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Check if message is a thank you
   */
  private isThankYou(message: string): boolean {
    return this.thankYouPatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Get a random greeting response
   */
  private getRandomGreeting(): string {
    const randomIndex = Math.floor(Math.random() * this.greetingResponses.length);
    return this.greetingResponses[randomIndex];
  }

  /**
   * Send a message and get a response with document-based context
   */
  async sendMessage(
    message: string,
    sessionId: string,
    options: IntegratedChatOptions = {}
  ): Promise<ChatMessage> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const { userId = session.userId, ...chatOptions } = options;

      // Create user message
      const userMessage = this.chatbotService.createUserMessage(message);
      session.messages.push(userMessage);

      // Check for greeting patterns
      if (this.isGreeting(message)) {
        const response = this.chatbotService.createAssistantMessage(this.getRandomGreeting());
        session.messages.push(response);
        session.updatedAt = new Date();
        return response;
      }

      // Check for thank you patterns
      if (this.isThankYou(message)) {
        const response = this.chatbotService.createAssistantMessage(this.thankYouResponse);
        session.messages.push(response);
        session.updatedAt = new Date();
        return response;
      }

      // Search for relevant documents if vector service is available
      let documentContext = '';
      if (this.vectorService) {
        try {
          console.log('\n=== DIAGNOSTIC: EMBEDDING STEP ===');
          console.log('User Query:', message);
          
          const queryEmbedding = await this.embeddingService.generateEmbedding(message);
          console.log('✅ Query embedding generated successfully');
          console.log('Embedding dimension:', queryEmbedding.embedding.length);
          console.log('First 5 values:', queryEmbedding.embedding.slice(0, 5));
          
          console.log('\n=== DIAGNOSTIC: VECTOR DB SEARCH STEP ===');

          // Check for common question patterns that should have broader search
          const questionPatterns = /\b(what|how|where|when|why|which|tell me|show me|give|generate|say|who|explain|describe|list)\b/i;
          const hasQuestionWords = questionPatterns.test(message);
          
          // If the user asks for a list-style query (e.g., "list", "what are the"), broaden the search
          const listQueryPatterns = /\b(list|pins|pin|what are the|list the)\b/i;
          const isListQuery = listQueryPatterns.test(message);

          // Use more relaxed thresholds for natural questions
          const topK = (isListQuery || hasQuestionWords) ? 15 : 8;
          const minScore = (isListQuery || hasQuestionWords) ? 0.15 : 0.25;

          console.log(`Using topK=${topK}, minScore=${minScore} for this query (isListQuery=${isListQuery}, hasQuestionWords=${hasQuestionWords})`);

          const relevantDocs = await this.vectorService.searchDocuments(
            queryEmbedding.embedding,
            topK,
            minScore
          );
          
          console.log(`✅ Pinecone returned ${relevantDocs.length} results`);
          
          // If no results found with initial search, try a more relaxed search
          let finalDocs = relevantDocs;
          if (relevantDocs.length === 0 && minScore > 0.1) {
            console.log('🔄 No results found, trying relaxed search...');
            const relaxedDocs = await this.vectorService.searchDocuments(
              queryEmbedding.embedding,
              15,
              0.1  // Very relaxed threshold
            );
            console.log(`✅ Relaxed search returned ${relaxedDocs.length} results`);
            finalDocs = relaxedDocs;
          }
          
          if (finalDocs.length > 0) {
            console.log('\n=== DIAGNOSTIC: RETRIEVED CHUNKS ===');
            finalDocs.forEach((doc, index) => {
              console.log(`\n--- Chunk ${index + 1} ---`);
              console.log('Similarity Score:', doc.score);
              console.log('Content Preview (first 200 chars):', doc.metadata.content.substring(0, 200) + '...');
              console.log('Full Content Length:', doc.metadata.content.length, 'characters');
            });
          } else {
            console.log('⚠️ No relevant documents found (all scores below threshold)');
          }

          if (finalDocs.length === 0) {
            // No relevant documents found - return template response
            console.log('\n=== DIAGNOSTIC: RESULT ===');
            console.log('❌ No relevant chunks found - returning fallback response');
            const response = this.chatbotService.createAssistantMessage(this.irrelevantQueryResponse);
            session.messages.push(response);
            session.updatedAt = new Date();
            return response;
          }

          // Build context from relevant documents (without revealing sources)
          documentContext = finalDocs
            .map(doc => doc.metadata.content)
            .join('\n\n');
          
          console.log('\n=== DIAGNOSTIC: CONTEXT PREPARED ===');
          console.log('Total context length:', documentContext.length, 'characters');
          console.log('Context preview (first 300 chars):', documentContext.substring(0, 300) + '...');

        } catch (error) {
          console.error('Error searching documents:', error);
          // Fallback to irrelevant query response if search fails
          const response = this.chatbotService.createAssistantMessage(this.irrelevantQueryResponse);
          session.messages.push(response);
          session.updatedAt = new Date();
          return response;
        }
      } else {
        // No vector service available - return template response
        const response = this.chatbotService.createAssistantMessage(this.irrelevantQueryResponse);
        session.messages.push(response);
        session.updatedAt = new Date();
        return response;
      }

      // Build system prompt for application-based responses
      // If this is a list/query-style request, instruct the model to merge and deduplicate list items from the context
      const listMergeInstruction = (/\b(list|pins|pin|what are the|power and ground|power pins|ground pins)\b/i.test(message) || /\b(what|how|where|when|why|which|tell me|show me|explain|describe)\b/i.test(message))
        ? 'If the information appears across multiple places in the provided context, merge and deduplicate items into one clear numbered list in your answer. After the list, include a short line that says exactly how many unique items you found (e.g. "Found X unique items.").'
        : '';

      const systemPrompt = `You are a helpful AI assistant built into this application to provide user support.

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:
1. If the user's question is not related to the application or if you cannot answer using the provided information, you MUST respond with this exact message: "Sorry, I can only help you with this application. Please ask any queries related to the application."
2. Never mention "documents", "files", "sources", "training data", "uploaded", or similar terms
3. Never explain why you can't help or mention limitations
4. For application-related questions, answer directly and professionally
5. Act as if the knowledge is built into your capabilities
6. NEVER include internal table references like "Table 9-1:", "Figure 3-2:", etc. in your responses - these are internal references that users don't need to see

FORMATTING REQUIREMENTS:
- Use clear headings with **bold text** for important concepts
- For technical calculations, formulas, or step-by-step procedures, use numbered lists or bullet points
- For pin configurations, I2C commands, or register settings, format them clearly with line breaks
- For specifications or values, present them in a structured, easy-to-read format
- Use markdown formatting extensively: **bold** for important values, code blocks for commands/registers
- Break long paragraphs into shorter, digestible sections
- For tabular data, ALWAYS use proper markdown table format with | separators and header separators (|---|---|)
- Example table format:
  | Parameter | Value | Unit |
  |---|---|---|
  | Voltage | 3.3V | V |
  | Current | 100mA | mA |
- Use bullet points (•) or numbered lists (1., 2., 3.) for step-by-step instructions
- Keep responses concise and mobile-friendly
- Remove any table/figure references like "Table X-Y:", "Figure A-B:", etc. from your responses
- The response should have better readability

${listMergeInstruction}

Available Information:
${documentContext}

User Question: ${message}

If this question is about the application and you can answer it using the information provided, give a direct helpful answer. If not, respond with the exact message specified in requirement 1.`;

      console.log('\n=== DIAGNOSTIC: LLM STEP ===');
      console.log('Sending to LLM (Groq)...');
      
      // Get response from chatbot with document context
      const response = await this.chatbotService.sendMessage(
        systemPrompt,
        [], // Don't include chat history to avoid confusion with context
        {
          ...chatOptions,
          systemPrompt: undefined // Override any system prompt from options
        }
      );

      console.log('✅ LLM Response received');
      console.log('Response preview (first 200 chars):', response.content.substring(0, 200));
      console.log('\n=== DIAGNOSTIC: FINAL RESULT ===');
      console.log('✅ Response successfully generated and added to session\n');

      session.messages.push(response);
      session.updatedAt = new Date();

      return response;

    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      // Create error response
      const errorResponse = this.chatbotService.createAssistantMessage(
        'I apologize, but I encountered an error while processing your request. Please try again.'
      );
      
      const session = this.sessions.get(sessionId);
      if (session) {
        session.messages.push(errorResponse);
        session.updatedAt = new Date();
      }
      
      return errorResponse;
    }
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): ChatSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if document service is available
   */
  isDocumentServiceAvailable(): boolean {
    return !!this.documentService;
  }

  /**
   * Get vector database service for advanced operations
   */
  getVectorService(): VectorDatabaseService | undefined {
    return this.vectorService;
  }

  /**
   * Get document service for advanced operations
   */
  getDocumentService(): SimpleDocumentProcessingService | undefined {
    return this.documentService;
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{ chatbot: boolean; vectorDB: boolean; embedding: boolean; documents: boolean }> {
    try {
      const chatbotStatus = await this.chatbotService.testConnection();
      const vectorDBStatus = this.vectorService ? await this.vectorService.testConnection() : false;
      const embeddingStatus = await this.embeddingService.testEmbedding();
      const documentsStatus = this.isDocumentServiceAvailable();

      return {
        chatbot: chatbotStatus,
        vectorDB: vectorDBStatus,
        embedding: embeddingStatus,
        documents: documentsStatus
      };
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        chatbot: false,
        vectorDB: false,
        embedding: false,
        documents: false
      };
    }
  }
}