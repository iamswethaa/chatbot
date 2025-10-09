import React from "react";

const Content: React.FunctionComponent = () => {

  return (
    <div className="text-gray-700 max-w-4xl mx-auto">     
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to the Chatbot App!</h1>
        
        <div className="space-y-4 text-lg">
          <p>
            This application features an integrated AI chatbot powered by <strong>Groq API</strong> and enhanced with <strong>Pinecone</strong> vector database for intelligent context awareness.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">🤖 AI Chatbot Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Powered by Groq's fast inference engine</li>
              <li>Context-aware conversations using vector embeddings</li>
              <li>Real-time message streaming</li>
              <li>Persistent chat history</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800 mb-2">🚀 How to Use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-green-700">
              <li>Click the chatbot button in the bottom-right corner</li>
              <li>Start typing your message in the chat interface</li>
              <li>Press Enter or click Send to get AI responses</li>
              <li>Enjoy intelligent conversations with context memory!</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-semibold text-amber-800 mb-2">⚙️ Setup Required:</h3>
            <p className="text-amber-700">
              Make sure to configure your <code className="bg-amber-100 px-1 rounded">.env</code> file with your Groq API key and Pinecone credentials for full functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
