import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Save, Loader2 } from 'lucide-react';

const ENDPOINT_GET = 'https://lxteajwzovoeclbytdrp.supabase.co/functions/v1/get-landing-texts';
const ENDPOINT_UPDATE = 'https://lxteajwzovoeclbytdrp.supabase.co/functions/v1/update-landing-texts';

interface TextEntry {
  key: string;
  label: string;
  section: string;
  multiline: boolean;
}

const fields: TextEntry[] = [
  // Navbar
  { key: 'nav_cta_button', label: 'Botão CTA', section: 'Navbar', multiline: false },
  // Hero
  { key: 'hero_badge', label: 'Badge', section: 'Hero', multiline: false },
  { key: 'hero_title_line1', label: 'Título — Linha 1', section: 'Hero', multiline: false },
  { key: 'hero_title_line2', label: 'Título — Linha 2', section: 'Hero', multiline: false },
  { key: 'hero_title_line3', label: 'Título — Linha 3 (destaque)', section: 'Hero', multiline: false },
  { key: 'hero_subtitle', label: 'Subtítulo', section: 'Hero', multiline: true },
  { key: 'hero_cta_primary', label: 'CTA Primário', section: 'Hero', multiline: false },
  { key: 'hero_cta_secondary', label: 'CTA Secundário', section: 'Hero', multiline: false },
  { key: 'hero_social_proof', label: 'Social Proof', section: 'Hero', multiline: false },
  // Features
  { key: 'features_title', label: 'Título', section: 'Features', multiline: false },
  { key: 'features_subtitle', label: 'Subtítulo', section: 'Features', multiline: true },
  // Testimonials
  { key: 'testimonials_title', label: 'Título', section: 'Testimonials', multiline: false },
  // Pricing
  { key: 'pricing_title', label: 'Título', section: 'Pricing', multiline: false },
  { key: 'pricing_subtitle', label: 'Subtítulo', section: 'Pricing', multiline: false },
  // Footer
  { key: 'footer_tagline', label: 'Tagline', section: 'Footer', multiline: false },
  { key: 'footer_copyright', label: 'Copyright', section: 'Footer', multiline: false },
];

const sections = ['Navbar', 'Hero', 'Features', 'Testimonials', 'Pricing', 'Footer'];

export default function LandingTextsPage() {
  const { toast } = useToast();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(ENDPOINT_GET)
      .then(r => r.json())
      .then(data => setTexts(data))
      .catch(() => toast({ title: 'Erro ao carregar textos', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Não autenticado');

      const res = await fetch(ENDPOINT_UPDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ texts }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar');
      }

      toast({ title: 'Textos atualizados com sucesso!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display text-light">Textos da Landing Page</h2>
            <p className="text-sm text-muted-light mt-1">Edite os textos exibidos na página inicial pública.</p>
          </div>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-emerald hover:bg-emerald/90 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
          </div>
        ) : (
          sections.map(section => {
            const sectionFields = fields.filter(f => f.section === section);
            return (
              <div key={section} className="rounded-xl border border-navy-border bg-navy p-6">
                <h3 className="text-lg font-display text-emerald mb-5">{section}</h3>
                <div className="space-y-4">
                  {sectionFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-muted-light mb-1.5">{field.label}</label>
                      {field.multiline ? (
                        <Textarea
                          value={texts[field.key] || ''}
                          onChange={e => setTexts(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="bg-navy-deep border-navy-border text-light placeholder:text-muted-light/50 focus:border-emerald"
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={texts[field.key] || ''}
                          onChange={e => setTexts(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="bg-navy-deep border-navy-border text-light placeholder:text-muted-light/50 focus:border-emerald"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}
