import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  hasSupabaseAdminConfig,
  hasSupabaseConfig,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl
} from "./config";

export function createServerSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
}

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminConfig) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false
    }
  });
}
