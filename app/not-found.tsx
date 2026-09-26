import Link from 'next/link';
import { CloseAIIcon } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-between px-6 py-12 select-none">

      <main className="text-center max-w-md my-auto space-y-6">
        <div className="text-7xl font-bold tracking-tighter text-muted-foreground/40 font-mono">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="text-md text-muted-foreground leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild className="rounded-full px-6 bg-foreground text-background hover:opacity-90">
            <Link href="/c">Go to Chat</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 border-border">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
