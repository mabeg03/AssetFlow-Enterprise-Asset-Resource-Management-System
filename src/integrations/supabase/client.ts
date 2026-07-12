import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xyendpubvbtyurcovzbj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW5kcHVidmJ0eXVyY292emJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTIxNzUsImV4cCI6MjA5OTM4ODE3NX0.p43e4RHg8Bji0pR1eXPc56zRMcuC3dP8BdOKCgyNdeE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
