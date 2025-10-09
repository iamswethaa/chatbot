# Chatbot

- Documents-based AI Assistant to help users
- RAG (Retrieval-Augmented Generation) architecture for accurate technical responses
- Hybrid Approach (Local Processing + Cloud-based Vector DB and LLM Service)

## Tech Stack

- **AI**: Groq SDK - *Llama 3.1 8B Instant* Model (Cloud-based)
- **Database**: Pinecone Vector Database (Cloud-based)
- **Embedings**: Transformer.js with *Xenova/all-MiniLM-L6-v2* Model (Local)
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Electron, Node.js
- **Build**: Vite, Electron Builder

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys for services (see Configuration below)

### Steps

- Clone the repository

   ```bash
   git clone https://github.com/swetha-nbase2/chatbot.git
   ```

- Install dependencies

   ```bash
   npm install
   ```

- Setup the API Keys

   Configure your .env file with API keys

   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:

   ```env
   # Groq API Configuration
   GROQ_API_KEY = your_groq_api_key_here

   # Pinecone Configuration
   PINECONE_API_KEY = your_pinecone_api_key_here
   PINECONE_ENVIRONMENT = your_pinecone_environment_here
   PINECONE_INDEX_NAME = your_pinecone_index_name_here

   # Chat Configuration
   MAX_CHAT_HISTORY = max_chat_history_here
   EMBEDDING_DIMENSION = embedding_dimension_here
   ```

   Create Groq API Key
   1. Visit [Groq Console](https://console.groq.com/)
   2. Create an account and generate an API key
   3. Add to `.env` as `GROQ_API_KEY`

   Create Pinecone API Key
   1. Visit [Pinecone](https://app.pinecone.io/)
   2. Create an account and get your API key
   3. Note your environment region
   4. Add to `.env` as `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`

- Process documents (one time)

   ```bash
   npm run process-docs
   ```

- Start the app

   ```bash
   npm run electron-dev
   ```

### The app uses an optimized workflow:

1. **One-time document processing**: Run `npm run process-docs` once to prepare your knowledge base
2. **Fast app startup**: Use `npm run electron-dev` for instant startup
3. **Update when needed**: Re-run document processing only when you add new documents

## 🎯 Usage

1. **Start the application**
2. **Click the chatbot button** (🤖) in the bottom-right corner
3. **Type your message** and press Enter or click Send
4. **Enjoy AI-powered conversations** with context memory!

## 📚 Workflow

### Knowledge Preparation:
- Upload necessary documents and data sheets
- Documents are chunked into smaller text segments
- Each chunk is embedded
- Embeddings are stored in vector database
- Knowledge base is ready for user queries

### Query Processing:
- User submits a query through chat interface
- Query is embedded into vector
- Vector DB retrieves the most relevant context chunks
- Context chunks and user query are combined into structured prompt
- LLM generates natural language response
- Response is returned to user in chat interface

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy chatting! 🚀**