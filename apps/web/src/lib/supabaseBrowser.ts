import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bypassAuth =
  process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH === "true" ||
  !supabaseUrl ||
  !supabaseAnonKey;

const mockSupabaseClient = {
  auth: {
    getSession: async () => ({
      data: { 
        session: { 
          access_token: "mock-local-token",
          user: {
            email: "local-admin@portfolio.local"
          }
        } 
      },
      error: null
    }),
    getUser: async () => ({
      data: {
        user: {
          email: "local-admin@portfolio.local",
          user_metadata: {
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
          }
        }
      },
      error: null
    }),
    signOut: async () => ({ error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signInWithOtp: async () => ({ data: {}, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    })
  }
} as any;

export const supabase = bypassAuth
  ? mockSupabaseClient
  : createBrowserClient(supabaseUrl!, supabaseAnonKey!);
