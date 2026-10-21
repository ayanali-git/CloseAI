'use client';

import { FileSearch, MessageSquare, Terminal, Eye } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="py-12 sm:py-16 w-full max-w-4xl mx-auto min-w-0">
      <header className="mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6">Product Features</h1>
        <p className="text-base sm:text-xl text-muted-foreground">
          Explore the core capabilities of the closeAI platform, designed to bring powerful AI to your fingertips.
        </p>
      </header>

      <div className="space-y-8 sm:space-y-12">
        {[
          {
            icon: MessageSquare,
            title: "Frontier Chat",
            description: "Engage in open-ended conversations, brainstorm ideas, draft content, and learn new subjects. Our chat model is optimized for nuance, accuracy, and helpfulness, drawing on extensive knowledge."
          },
          {
            icon: Terminal,
            title: "Code Interpreter",
            description: "A secure, sandboxed execution environment where the model can run Python code, analyze data, create charts, and solve complex mathematical problems iteratively."
          },
          {
            icon: Eye,
            title: "Multimodal Vision",
            description: "Upload images and documents. The model can analyze visual content, extract text from charts, describe scenes, and answer questions based on the visual context you provide."
          },
          {
            icon: FileSearch,
            title: "Document Search & Retrieval",
            description: "Seamlessly search across large repositories of documents. Our embeddings and vector search capabilities ensure you find relevant information quickly and accurately."
          }
        ].map((feature, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start p-6 sm:p-8 bg-card border border-border/80 dark:border-none rounded-sm">
            <div className="p-3 sm:p-4 bg-secondary rounded-2xl shrink-0">
              <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">{feature.title}</h2>
              <p className="text-base sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
