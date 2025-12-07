// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// 🔧 Tu proyecto Supabase
const SUPABASE_URL = "https://hmeqdnzehahsgpkzpttn.supabase.co";

// 🔧 Llave pública ANON (segura para frontend)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXFkbnplaGFoc2dwa3pwdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjQ3NTcsImV4cCI6MjA4MDYwMDc1N30.6i50cs0bmNSSGOFFVq1-_WEOPA3-PVtyu-NoygYMcbg";

// 📦 Exportar cliente listo para usar en toda la app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
