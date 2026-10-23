'use client';

import { AnimatedArrow } from '@/components/ui/animated';
import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    {
      title: "Introducing Frontier Chat: The Next Generation of Conversational AI",
      category: "Product",
      date: "August 20, 2026",
      readTime: "5 min read",
      excerpt: "Today we are releasing Frontier Chat, a new model trained to provide highly accurate, nuanced, and safe conversational interactions."
    },
    {
      title: "Advancements in Multimodal Vision Models",
      category: "Research",
      date: "August 15, 2026",
      readTime: "8 min read",
      excerpt: "Our latest research exploring how vision models can better understand spatial reasoning and context in complex images."
    },
    {
      title: "Commitment to AI Safety Guidelines",
      category: "Company",
      date: "August 02, 2026",
      readTime: "4 min read",
      excerpt: "An update on our ongoing efforts to establish robust safety guidelines and benchmarks for future AI models."
    }
  ];

  return (
    <div className="py-12 sm:py-16 w-full max-w-4xl mx-auto min-w-0">
      <header className="mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6">Blog</h1>
        <p className="text-base sm:text-xl text-muted-foreground">The latest news, announcements, and research from the closeAI team.</p>
      </header>

      <div className="space-y-10 sm:space-y-12">
        {posts.map((post, i) => (
          <article key={i} className="group cursor-pointer pb-8 border-b border-border/80 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-base sm:text-base text-muted-foreground mb-2 sm:mb-3">
              <span className="font-medium text-foreground">{post.category}</span>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-muted-foreground group-hover:text-foreground">{post.title}</h2>
            <p className="text-muted-foreground text-base sm:text-base mb-4 leading-relaxed">{post.excerpt}</p>
            <div className="inline-flex items-center text-base sm:text-base font-medium text-foreground">
              <span>Read article</span>
              <AnimatedArrow size={20} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
