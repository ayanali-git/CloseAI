'use client';

export default function ApiDocsPage() {
  return (
    <div className="py-12 sm:py-16 w-full max-w-4xl mx-auto min-w-0">
      <header className="mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6">API Reference</h1>
        <p className="text-base sm:text-xl text-muted-foreground">
          Complete documentation for the closeAI REST API. Learn how to authenticate, make requests, and integrate our models into your applications.
        </p>
      </header>

      <section className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Authentication</h2>
        <p className="text-muted-foreground mb-4 text-base sm:text-base">
          All API requests require a Bearer token in the Authorization header. You can generate API keys in your dashboard.
        </p>
        <div className="bg-card border border-border/80 dark:border-none rounded-xl p-3 sm:p-4 overflow-x-auto text-base sm:text-base font-mono break-all text-foreground">
          Authorization: Bearer YOUR_API_KEY
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Chat Completions</h2>
        <p className="text-muted-foreground mb-4 text-base sm:text-base">
          Creates a model response for the given chat conversation.
        </p>
        
        <h3 className="text-base sm:text-lg font-medium mb-3">Endpoint</h3>
        <div className="bg-card border border-border/80 dark:border-none rounded-xl p-3 sm:p-4 mb-6 font-mono text-base sm:text-base overflow-x-auto break-all text-foreground">
          <span className="font-bold text-muted-foreground mr-2">POST</span>
          <span>https://api.trycloseai.vercel.app/v1/chat/completions</span>
        </div>

        <h3 className="text-base sm:text-lg font-medium mb-3">Example Request</h3>
        <pre className="bg-card border border-border/80 dark:border-none rounded-xl p-3 sm:p-4 overflow-x-auto text-base sm:text-base text-foreground w-full max-w-full font-mono">
          <code>{`curl https://api.trycloseai.vercel.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $CLOSEAI_API_KEY" \\
  -d '{
    "model": "frontier-chat-v1",
    "messages": [
      {
        "role": "user",
        "content": "Hello, world!"
      }
    ]
  }'`}</code>
        </pre>
      </section>
    </div>
  );
}
