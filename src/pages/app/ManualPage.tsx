import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

export default function ManualPage() {
  const { loading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    supabase
      .from('system_prompts')
      .select('prompt, updated_at')
      .eq('key', 'user_manual')
      .maybeSingle()
      .then(({ data, error }) => {
        console.log('manual data:', data, 'error:', error);
        setContent(data?.prompt ?? '');
        setUpdatedAt(data?.updated_at ?? null);
        setLoading(false);
      });
  }, [authLoading]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Manual do Usuário</h1>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !content ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Manual em construção. Em breve mais informações.</p>
          </div>
        ) : (
          <>
            <div className="prose prose-invert max-w-none
              prose-h1:text-2xl prose-h1:font-display prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:font-display prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-emerald
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-muted-foreground prose-li:mb-2
              prose-ul:my-4 prose-ol:my-4
              prose-hr:border-border prose-hr:my-8
              prose-strong:text-foreground
              prose-a:text-emerald prose-a:no-underline hover:prose-a:underline
              prose-code:bg-secondary prose-code:px-1 prose-code:rounded prose-code:text-sm
              prose-blockquote:border-emerald prose-blockquote:text-muted-foreground
              prose-th:text-foreground prose-td:text-foreground
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>

            {updatedAt && (
              <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                Última atualização: {new Date(updatedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
