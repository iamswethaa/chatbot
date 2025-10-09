import { Pinecone } from '@pinecone-database/pinecone';
import { ChatMessage } from './chatbotService.js';

export interface VectorMetadata {
  messageId: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  content: string;
  [key: string]: any;
}

export interface DocumentMetadata {
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  pageNumber?: number;
  timestamp: number;
  [key: string]: any;
}

export interface DocumentData {
  id: string;
  text: string;
  embedding: number[];
  metadata: DocumentMetadata;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export class VectorDatabaseService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor(apiKey: string, indexName: string) {
    this.pinecone = new Pinecone({
      apiKey: apiKey,
    });
    this.indexName = indexName;
  }

  /**
   * Initialize the Pinecone index
   */
  async initializeIndex(dimension: number = 384): Promise<void> {
    try {
      // Check if index exists
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        console.log('Waiting for index to be ready...');
        await this.waitForIndexReady();
      }
    } catch (error) {
      console.error('Error initializing Pinecone index:', error);
      throw new Error(`Failed to initialize vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(maxAttempts: number = 60): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
        if (indexStats) {
          console.log('Index is ready!');
          return;
        }
      } catch (error) {
        // Index not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    throw new Error('Index failed to become ready within timeout period');
  }

  /**
   * Store a document chunk with its embedding
   */
  async storeDocument(document: DocumentData): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const metadata = {
        ...document.metadata,
        content: document.text,
        type: 'document' // Distinguish from chat messages
      };

      await index.upsert([{
        id: document.id,
        values: document.embedding,
        metadata
      }]);

    } catch (error) {
      console.error('Error storing document in vector database:', error);
      throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for relevant document chunks
   */
  async searchDocuments(
    queryEmbedding: number[],
    topK: number = 5,
    minScore: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: { type: 'document' } // Only search documents, not chat messages
      });

      return queryResponse.matches?.filter(match => (match.score || 0) >= minScore)
        .map(match => ({
          id: match.id,
          score: match.score || 0,
          metadata: match.metadata as VectorMetadata
        })) || [];

    } catch (error) {
      console.error('Error searching documents in vector database:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store a chat message with its embedding
   */
  async storeMessage(
    messageId: string,
    embedding: number[],
    message: ChatMessage,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const metadata: VectorMetadata = {
        messageId,
        userId,
        sessionId,
        timestamp: message.timestamp.getTime(),
        content: message.content
      };

      await index.upsert([{
        id: messageId,
        values: embedding,
        metadata
      }]);

    } catch (error) {
      console.error('Error storing message in vector database:', error);
      throw new Error(`Failed to store message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for similar messages
   */
  async searchSimilarMessages(
    queryEmbedding: number[],
    topK: number = 5,
    userId?: string,
    sessionId?: string
  ): Promise<SearchResult[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (sessionId) filter.sessionId = sessionId;

      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      });

      return queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as VectorMetadata
      })) || [];

    } catch (error) {
      console.error('Error searching vector database:', error);
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get chat context based on similarity search
   */
  async getChatContext(
    queryEmbedding: number[],
    maxContextLength: number = 3,
    userId?: string,
    sessionId?: string
  ): Promise<ChatMessage[]> {
    try {
      const results = await this.searchSimilarMessages(
        queryEmbedding,
        maxContextLength,
        userId,
        sessionId
      );

      return results
        .filter(result => result.score > 0.7) // Only include highly relevant messages
        .map(result => ({
          id: result.metadata.messageId,
          role: 'assistant' as const, // Assuming we're retrieving assistant responses for context
          content: result.metadata.content,
          timestamp: new Date(result.metadata.timestamp)
        }));

    } catch (error) {
      console.error('Error getting chat context:', error);
      return []; // Return empty context on error
    }
  }

  /**
   * Delete messages for a specific session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      // Note: Pinecone doesn't support delete by metadata filter directly
      // You would need to first query for all vectors with the sessionId
      // then delete them by their IDs
      const searchResults = await this.searchSimilarMessages(
        new Array(1536).fill(0), // Dummy vector for search
        10000, // Large number to get all results
        undefined,
        sessionId
      );

      if (searchResults.length > 0) {
        const idsToDelete = searchResults.map(result => result.id);
        await index.deleteMany(idsToDelete);
      }

    } catch (error) {
      console.error('Error deleting session from vector database:', error);
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const index = this.pinecone.index(this.indexName);
      return await index.describeIndexStats();
    } catch (error) {
      console.error('Error getting index stats:', error);
      return null;
    }
  }

  /**
   * Clear all vectors from the index
   */
  async clearAll(): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteAll();
      console.log('All vectors cleared from the index');
    } catch (error) {
      console.error('Error clearing all vectors:', error);
      throw new Error(`Failed to clear vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to Pinecone
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.pinecone.listIndexes();
      return true;
    } catch (error) {
      console.error('Pinecone connection test failed:', error);
      return false;
    }
  }
}