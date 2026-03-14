import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

export default function ManualPage() {
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('system_prompts')
      .select('prompt, updated_at')
      .eq('key', 'user_manual')
      .single()
      .then(({ data }) => {
        setContent(data?.prompt ?? '');
        setUpdatedAt(data?.updated_at ?? null);
        setLoading(false);
      });
  }, []);

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
            <article className="prose prose-sm max-w-none
              prose-headings:font-display prose-headings:text-foreground
              prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground
              prose-a:text-emerald prose-a:no-underline hover:prose-a:underline
              prose-code:bg-muted prose-code:text-foreground prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs
              prose-hr:border-border
              prose-blockquote:border-emerald prose-blockquote:text-muted-foreground
              prose-th:text-foreground prose-td:text-foreground
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>

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
