/**
 * Standalone Document Processing Script
 * 
 * This script processes all documents in the documents folder and stores them in the vector database.
 * Run this script once before using the chatbot app to avoid startup delays.
 * 
 * Usage:
 *   node scripts/process-documents.js
 *   npm run process-docs
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

async function processDocuments() {
  console.log('🚀 Starting document processing...\n');
  
  try {
    // Check environment variables
    console.log('🔍 Checking environment configuration...');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set in .env file');
    }
    
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME is not set in .env file');
    }
    
    console.log('✅ Environment variables configured\n');
    
    // Dynamic imports for ES modules
    console.log('🔧 Initializing services...');
    
    const { VectorDatabaseService } = await import('../dist-electron/services/vectorDatabaseService.js');
    const { LocalEmbeddingService } = await import('../dist-electron/Electron/localEmbeddingService.js');
    const { SimpleDocumentProcessingService } = await import('../dist-electron/services/simpleDocumentProcessingService.js');
    
    const vectorService = new VectorDatabaseService(
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_INDEX_NAME
    );
    
    const embeddingService = new LocalEmbeddingService();
    
    // Test vector database connection
    console.log('🔗 Testing vector database connection...');
    const vectorConnected = await vectorService.testConnection();
    if (!vectorConnected) {
      throw new Error('Failed to connect to vector database');
    }
    console.log('✅ Vector database connected\n');
    
    // Initialize embedding service
    console.log('🤖 Initializing embedding service...');
    const embeddingWorking = await embeddingService.testEmbedding();
    if (!embeddingWorking) {
      throw new Error('Embedding service failed to initialize');
    }
    console.log('✅ Embedding service ready\n');
    
    // Initialize document processing service
    const documentService = new SimpleDocumentProcessingService(
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_INDEX_NAME,
      process.env.OPENAI_API_KEY
    );
    
    // Get database stats before processing
    console.log('📊 Checking current database status...');
    try {
      const stats = await vectorService.getIndexStats();
      const currentVectorCount = stats.totalRecordCount || stats.recordCount || 0;
      console.log(`Current vectors in database: ${currentVectorCount}\n`);
      
      if (currentVectorCount > 0) {
        console.log('⚠️  Database already contains vectors.');
        console.log('This will add new vectors alongside existing ones.');
        console.log('To clear the database first, run: npm run clear-db\n');
      }
    } catch (error) {
      console.log('ℹ️  Could not get database stats (database might be empty)\n');
    }
    
    // Process documents
    console.log('📚 Processing documents...');
    console.log('This may take a few minutes depending on document size...\n');
    
    const startTime = Date.now();
    await documentService.processAllDocuments();
    const endTime = Date.now();
    
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 Document processing completed successfully!');
    console.log(`⏱️  Processing time: ${processingTime} seconds`);
    
    // Get final database stats
    try {
      const finalStats = await vectorService.getIndexStats();
      const finalVectorCount = finalStats.totalRecordCount || finalStats.recordCount || 0;
      console.log(`📈 Total vectors in database: ${finalVectorCount}`);
    } catch (error) {
      console.log('ℹ️  Could not get final database stats');
    }
    
    console.log('\n✨ Your chatbot is now ready to use!');
    console.log('Run: npm run electron-dev');
    
  } catch (error) {
    console.error('\n❌ Error during document processing:');
    console.error(error.message);
    console.error('\nPlease check your configuration and try again.');
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Processing interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Processing terminated');
  process.exit(0);
});

// Run the script
processDocuments();

module.exports = { processDocuments };