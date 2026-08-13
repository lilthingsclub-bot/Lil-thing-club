// js/supabase.js
// Lil Things Club - Supabase client
// This file is safe to ship to the browser.
// IMPORTANT: use only your publishable key here, never a secret/service-role key.

const SUPABASE_URL = "https://wzdjjctrxwvtugssnalf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nlxyJrJ3RqtsjP6RtMByyg_a5tYT1G3";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
