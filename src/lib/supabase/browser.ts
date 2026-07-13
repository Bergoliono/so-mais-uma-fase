"use client";

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "./config";

export function createBrowserSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
