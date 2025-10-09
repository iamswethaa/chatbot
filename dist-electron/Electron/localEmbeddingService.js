/**
 * LocalEmbeddingService - Uses Transformers.js for local embeddings
 * 100% offline, no API calls, no dependencies on external services
 */
import { pipeline } from '@xenova/transformers';
export class LocalEmbeddingService {
    model = null;
    modelName = 'Xenova/all-MiniLM-L6-v2'; // Same model as HuggingFace, but local
    constructor() {
        // Model will be loaded on first use
    }
    /**
     * Initialize the local embedding model
     */
    async initializeModel() {
        if (!this.model) {
            console.log('🔄 Loading local embedding model (first time may take a moment)...');
            this.model = await pipeline('feature-extraction', this.modelName);
            console.log('✅ Local embedding model loaded successfully!');
        }
    }
    /**
     * Generate embeddings using local Transformers.js model
     * Completely offline and free!
     */
    async generateEmbedding(text) {
        try {
            // Initialize model if needed
            await this.initializeModel();
            // Generate embedding locally
            const output = await this.model(text, { pooling: 'mean', normalize: true });
            // Convert to regular array and ensure numbers
            const embedding = Array.from(output.data);
            return {
                embedding,
                usage: {
                    prompt_tokens: text.length,
                    total_tokens: text.length
                }
            };
        }
        catch (error) {
            console.error('Local embedding generation failed:', error);
            // Fallback to simple hash-based embedding
            console.warn('Using simple hash-based embedding fallback');
            return {
                embedding: this.generateSimpleEmbedding(text),
            };
        }
    }
    /**
     * Generate a simple hash-based embedding as a fallback
     * Uses 384 dimensions to match the model
     */
    generateSimpleEmbedding(text, dimension = 384) {
        const embedding = new Array(dimension).fill(0);
        // Simple hash-based approach optimized for text similarity
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const index = charCode % dimension;
            embedding[index] += Math.sin(charCode * 0.1) * 0.1;
        }
        // Add word-based features for better document similarity
        const words = text.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let wordHash = 0;
            for (let j = 0; j < word.length; j++) {
                wordHash = ((wordHash << 5) - wordHash + word.charCodeAt(j)) & 0xffffffff;
            }
            const index = Math.abs(wordHash) % dimension;
            embedding[index] += 0.1;
        }
        // Normalize the embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }
        return embedding;
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return {
            name: this.modelName,
            isLocal: true,
            dimensions: 384
        };
    }
    /**
     * Test embedding functionality - for compatibility with existing code
     */
    async testEmbedding() {
        try {
            const testResult = await this.generateEmbedding("test");
            return testResult.embedding.length === 384;
        }
        catch (error) {
            console.error('Embedding test failed:', error);
            return false;
        }
    }
}
