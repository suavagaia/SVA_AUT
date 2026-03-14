import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Section {
  title: string;
  content: string;
}

function parseMarkdownSections(md: string): Section[] {
  const lines = md.split('\n');
  const sections: Section[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = h2Match[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  return sections;
}

const markdownClasses = `
  prose prose-invert max-w-none prose-sm
  prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-foreground
  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
  prose-li:text-muted-foreground prose-li:mb-1
  prose-ul:my-3 prose-ul:pl-4 prose-ol:my-3 prose-ol:pl-4
  prose-strong:text-foreground
  prose-a:text-emerald prose-a:no-underline hover:prose-a:underline
  prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
  prose-blockquote:border-emerald prose-blockquote:text-muted-foreground
  prose-hr:border-border prose-hr:my-6
`;

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
        setContent(data?.prompt ?? '');
        setUpdatedAt(data?.updated_at ?? null);
        setLoading(false);
      });
  }, [authLoading]);

  const sections = useMemo(() => parseMarkdownSections(content), [content]);

  // Extract intro (content before first ##)
  const intro = useMemo(() => {
    const firstH2 = content.indexOf('\n## ');
    if (firstH2 === -1) return content;
    return content.substring(0, firstH2).trim();
  }, [content]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-emerald" />
          <h1 className="font-display text-2xl font-bold text-foreground">Manual do Usuário</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : !content ? (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Manual em construção. Em breve mais informações.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Intro section */}
            {intro && (
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className={markdownClasses}>
                    <ReactMarkdown>{intro}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FAQ-style accordion sections */}
            {sections.length > 0 && (
              <Accordion type="multiple" defaultValue={sections.map((_, i) => `section-${i}`)} className="space-y-3">
                {sections.map((section, i) => (
                  <AccordionItem
                    key={i}
                    value={`section-${i}`}
                    className="border border-border bg-card rounded-xl px-6 overflow-hidden data-[state=closed]:rounded-xl"
                  >
                    <AccordionTrigger className="text-base font-display text-emerald hover:no-underline py-5">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className={markdownClasses}>
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {updatedAt && (
              <p className="text-xs text-muted-foreground pt-2">
                Última atualização: {new Date(updatedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
