import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qhizydjiclutlcgxzecq.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXp5ZGppY2x1dGxjZ3h6ZWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTEwOTYsImV4cCI6MjEwNjA2NzA5Nn0.dx782OZjrzz0eYLl5NjfNuz25Gd_ZN151pIP8JIWVJM';

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);
