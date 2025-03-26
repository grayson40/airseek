import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xaxahgtxxecoxecvgstv.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheGFoZ3R4eGVjb3hlY3Znc3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NTA4NzIsImV4cCI6MjA1MzUyNjg3Mn0.KceuRCod1p19oDlb5cUt_Chelx-V7NOv1ULCZrePg-g"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)