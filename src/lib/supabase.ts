import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxteajwzovoeclbytdrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGVhand6b3ZvZWNsYnl0ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzkxMzcsImV4cCI6MjA4ODkxNTEzN30.BLB9qSJcZMKsWhix46ASUbOW2lA0PSeyHN97jMQQGkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // sessionStorage: a sessão sobrevive a F5 na mesma aba, mas é limpa ao
    // fechar a aba/janela → exige novo login a cada nova sessão do navegador.
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
