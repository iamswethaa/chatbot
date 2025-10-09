/**
 * Database Clear Script
 * 
 * This script clears all vectors from the Pinecone database.
 * Use this when you want to start fresh with document processing.
 * 
 * Usage:
 *   node scripts/clear-database.cjs
 *   npm run clear-db
 */

const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function clearDatabase() {
  console.log('🗑️  Database Clear Utility\n');
  
  // Check for auto-confirm flag
  const autoConfirm = process.argv.includes('--confirm');
  
  try {
    // Check environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set in .env file');
    }
    
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME is not set in .env file');
    }

    // Dynamic import for ES modules
    const { VectorDatabaseService } = await import('../dist-electron/services/vectorDatabaseService.js');
    
    // Initialize vector service
    const vectorService = new VectorDatabaseService(
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_INDEX_NAME
    );
    
    // Test connection
    console.log('🔗 Testing database connection...');
    const connected = await vectorService.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to vector database');
    }
    console.log('✅ Connected to database\n');
    
    // Get current stats
    try {
      const stats = await vectorService.getIndexStats();
      const vectorCount = stats.totalRecordCount || stats.recordCount || 0;
      
      if (vectorCount === 0) {
        console.log('ℹ️  Database is already empty (no vectors to delete)');
        rl.close();
        return;
      }
      
      console.log(`📊 Current database contains: ${vectorCount} vectors\n`);
      
      // Confirm deletion
      console.log('⚠️  WARNING: This will permanently delete ALL vectors from the database!');
      console.log('This action cannot be undone.\n');
      
      let confirmed = autoConfirm;
      if (!confirmed) {
        const confirmation = await askQuestion('Are you sure you want to continue? (type "yes" to confirm): ');
        confirmed = confirmation.toLowerCase() === 'yes';
      } else {
        console.log('Auto-confirmation enabled via --confirm flag');
      }
      
      if (!confirmed) {
        console.log('❌ Operation cancelled');
        rl.close();
        return;
      }
      
      // Clear the database
      console.log('\n🗑️  Clearing database...');
      await vectorService.clearAll();
      
      // Verify clearing
      const finalStats = await vectorService.getIndexStats();
      const remainingVectors = finalStats.totalRecordCount || finalStats.recordCount || 0;
      
      if (remainingVectors === 0) {
        console.log('✅ Database cleared successfully!');
        console.log('\n🔄 You can now run "npm run process-docs" to add fresh documents');
      } else {
        console.log(`⚠️  Warning: ${remainingVectors} vectors may still remain`);
      }
      
    } catch (error) {
      if (error.message && error.message.includes('not found')) {
        console.log('ℹ️  Database appears to be empty or not initialized');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error clearing database:');
    console.error(error.message);
    console.error('\nPlease check your configuration and try again.');
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    rl.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Operation cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the script
clearDatabase();

module.exports = { clearDatabase };