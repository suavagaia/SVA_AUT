import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxteajwzovoeclbytdrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGVhand6b3ZvZWNsYnl0ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzkxMzcsImV4cCI6MjA4ODkxNTEzN30.BLB9qSJcZMKsWhix46ASUbOW2lA0PSeyHN97jMQQGkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
