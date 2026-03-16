import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2 } from 'lucide-react';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co/functions/v1';

interface TextFieldDef {
  key: string;
  label: string;
  multiline?: boolean;
}

const SECTIONS: { title: string; fields: TextFieldDef[] }[] = [
  {
    title: 'Navbar',
    fields: [
      { key: 'nav_cta_button', label: 'Botão CTA' },
    ],
  },
  {
    title: 'Hero',
    fields: [
      { key: 'hero_badge', label: 'Badge' },
      { key: 'hero_title_line1', label: 'Título — Linha 1' },
      { key: 'hero_title_line2', label: 'Título — Linha 2' },
      { key: 'hero_title_line3', label: 'Título — Linha 3 (destaque)' },
      { key: 'hero_subtitle', label: 'Subtítulo', multiline: true },
      { key: 'hero_cta_primary', label: 'CTA Primário' },
      { key: 'hero_cta_secondary', label: 'CTA Secundário' },
      { key: 'hero_social_proof', label: 'Prova social' },
    ],
  },
  {
    title: 'Features (Agentes)',
    fields: [
      { key: 'features_title', label: 'Título da seção' },
      { key: 'features_subtitle', label: 'Subtítulo' },
    ],
  },
  {
    title: 'Depoimentos / FAQ',
    fields: [
      { key: 'testimonials_title', label: 'Título da seção' },
    ],
  },
  {
    title: 'Pricing',
    fields: [
      { key: 'pricing_title', label: 'Título' },
      { key: 'pricing_subtitle', label: 'Subtítulo' },
    ],
  },
  {
    title: 'Footer',
    fields: [
      { key: 'footer_tagline', label: 'Tagline' },
      { key: 'footer_copyright', label: 'Copyright' },
    ],
  },
];

export default function LandingTextsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/get-landing-texts`)
      .then(r => r.json())
      .then(data => { setTexts(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/update-landing-texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast({ title: 'Textos atualizados com sucesso!' });
    } catch {
      toast({ title: 'Erro ao salvar textos', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display text-light">Textos da Landing Page</h2>
            <p className="text-sm text-muted-light mt-1">Edite os textos exibidos na página pública.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-emerald hover:bg-emerald/90 text-navy-deep"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald" />
          </div>
        ) : (
          SECTIONS.map(section => (
            <div key={section.title} className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-lg font-semibold text-emerald mb-4">{section.title}</h3>
              <div className="space-y-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-muted-light mb-1.5">{field.label} <span className="text-xs opacity-50">({field.key})</span></label>
                    {field.multiline ? (
                      <Textarea
                        value={texts[field.key] || ''}
                        onChange={e => setTexts(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="bg-navy border-navy-border text-light min-h-[100px]"
                      />
                    ) : (
                      <Input
                        value={texts[field.key] || ''}
                        onChange={e => setTexts(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="bg-navy border-navy-border text-light"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
