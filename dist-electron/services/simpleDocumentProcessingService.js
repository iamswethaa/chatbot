import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { LocalEmbeddingService } from '../Electron/localEmbeddingService.js';
import { VectorDatabaseService } from './vectorDatabaseService.js';
const require = createRequire(import.meta.url);
export class SimpleDocumentProcessingService {
    embeddingService;
    vectorDatabaseService;
    documentsPath;
    constructor(pineconeApiKey, pineconeIndexName) {
        this.embeddingService = new LocalEmbeddingService();
        this.vectorDatabaseService = new VectorDatabaseService(pineconeApiKey, pineconeIndexName);
        this.documentsPath = path.join(process.cwd(), 'documents');
    }
    /**
     * Process all supported files in the documents folder (.pdf, .txt, .md)
     */
    async processAllDocuments() {
        try {
            // Ensure documents folder exists
            if (!fs.existsSync(this.documentsPath)) {
                fs.mkdirSync(this.documentsPath, { recursive: true });
                console.log('Created documents folder at:', this.documentsPath);
                return;
            }
            const files = fs.readdirSync(this.documentsPath);
            const supportedFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.pdf' || ext === '.txt' || ext === '.md';
            });
            console.log(`Found ${supportedFiles.length} supported files to process`);
            for (const file of supportedFiles) {
                const ext = path.extname(file).toLowerCase();
                if (ext === '.pdf') {
                    await this.processPDFFile(file);
                }
                else if (ext === '.txt' || ext === '.md') {
                    await this.processTextFile(file);
                }
            }
            console.log('All documents processed successfully');
        }
        catch (error) {
            console.error('Error processing documents:', error);
            throw error;
        }
    }
    /**
     * Process a single PDF file
     */
    async processPDFFile(filename) {
        try {
            const filePath = path.join(this.documentsPath, filename);
            console.log(`Processing PDF: ${filename}`);
            // Read PDF file
            const pdfBuffer = fs.readFileSync(filePath);
            // Parse PDF using dynamic require
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(pdfBuffer);
            // Extract text content
            const fullText = pdfData.text;
            if (!fullText.trim()) {
                console.warn(`No text content found in ${filename}`);
                return;
            }
            // Split text into chunks
            const chunks = this.chunkText(fullText, filename);
            // Process each chunk
            for (const chunk of chunks) {
                await this.processChunk(chunk);
            }
            console.log(`Successfully processed ${filename} with ${chunks.length} chunks`);
        }
        catch (error) {
            console.error(`Error processing PDF file ${filename}:`, error);
            throw error;
        }
    }
    /**
     * Process a single text file
     */
    async processTextFile(filename) {
        try {
            const filePath = path.join(this.documentsPath, filename);
            console.log(`Processing text file: ${filename}`);
            // Read text file
            const fullText = fs.readFileSync(filePath, 'utf-8');
            if (!fullText.trim()) {
                console.warn(`No text content found in ${filename}`);
                return;
            }
            // Split text into chunks
            const chunks = this.chunkText(fullText, filename);
            // Process each chunk
            for (const chunk of chunks) {
                await this.processChunk(chunk);
            }
            console.log(`Successfully processed ${filename} with ${chunks.length} chunks`);
        }
        catch (error) {
            console.error(`Error processing text file ${filename}:`, error);
            throw error;
        }
    }
    /**
     * Split text into manageable chunks
     */
    chunkText(text, filename) {
        const maxChunkSize = 1000; // characters
        const overlap = 100; // character overlap between chunks
        const chunks = [];
        const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
        let currentChunk = '';
        let chunkIndex = 0;
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
                if (currentChunk.trim()) {
                    chunks.push({
                        id: `${filename}-chunk-${chunkIndex}`,
                        text: currentChunk.trim(),
                        metadata: {
                            filename,
                            chunkIndex,
                            totalChunks: 0 // Will be updated later
                        }
                    });
                    // Keep overlap from previous chunk
                    const words = currentChunk.split(' ');
                    const overlapWords = words.slice(-Math.floor(overlap / 6)); // Rough estimate
                    currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
                    chunkIndex++;
                }
                else {
                    currentChunk = trimmedSentence;
                }
            }
            else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }
        // Add the last chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: `${filename}-chunk-${chunkIndex}`,
                text: currentChunk.trim(),
                metadata: {
                    filename,
                    chunkIndex,
                    totalChunks: 0
                }
            });
        }
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * Process a single chunk (create embedding and store in vector DB)
     */
    async processChunk(chunk) {
        try {
            // Generate embedding for the chunk
            const embeddingResponse = await this.embeddingService.generateEmbedding(chunk.text);
            // Store in vector database
            await this.vectorDatabaseService.storeDocument({
                id: chunk.id,
                text: chunk.text,
                embedding: embeddingResponse.embedding,
                metadata: {
                    ...chunk.metadata,
                    timestamp: Date.now()
                }
            });
            console.log(`Stored chunk: ${chunk.id}`);
        }
        catch (error) {
            console.error(`Error processing chunk ${chunk.id}:`, error);
            throw error;
        }
    }
    /**
     * Get documents path
     */
    getDocumentsPath() {
        return this.documentsPath;
    }
}
