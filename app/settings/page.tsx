'use client';

import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    window.location.replace(user ? '/c#settings' : '/gc#settings');
  }, [user, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}
