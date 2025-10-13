import React from 'react';

const Tile: React.FC<{title: string; icon?: string; children?: React.ReactNode}> = ({ title, icon, children }) => (
  <div className="bg-panel rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start space-x-3">
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-app-muted text-sm mt-1">{children}</div>
      </div>
    </div>
  </div>
);

const Content: React.FC = () => {
  return (
    <div className="text-app max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold mb-2">Chatbot Playground</h1>
        <p className="text-app-muted">Explore sample prompts, quick tools, and knowledge resources. Click a card to try it in the chat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Tile title="Prompt Recipes" icon="🧩">
          Ready-made prompt recipes for summarization, code help, brainstorming and more. Try "Summarize this document" or "Refactor this code".
        </Tile>

        <Tile title="Quick Tools" icon="⚡">
          Tools to speed tasks: Translate, Extract Action Items, Create Tests, Generate Examples.
        </Tile>

        <Tile title="Knowledge Hub" icon="📚">
          Upload documents and query your knowledge base. Use contextual answers backed by your document set.
        </Tile>

        <Tile title="Examples" icon="✨">
          Example conversations and templates you can copy into the chat to get instant results.
        </Tile>

        <Tile title="Shortcuts" icon="⌨️">
          Keyboard shortcuts and tips to become more productive with the assistant.
        </Tile>

        <Tile title="Settings & Integrations" icon="⚙️">
          Configure API keys, vector DB connections and model options. Fine-tune temperature and response length.
        </Tile>
      </div>

      <div className="mt-8">
        <div className="bg-muted p-4 rounded-md border border-app">
          <h3 className="font-semibold">Try a sample prompt</h3>
          <div className="mt-2 text-app-muted">"What are the power modes available?"</div>
        </div>
      </div>
    </div>
  );
};

export default Content;
