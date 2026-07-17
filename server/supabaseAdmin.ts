import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { ApiRequest } from "./http";
import { getBearerToken } from "./http";

type SupabaseServerClients = {
  adminClient: SupabaseClient;
  publicKey: string;
  url: string;
};

export function getSupabaseServerClients(): SupabaseServerClients | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publicKey = process.env.SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.VITE_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !publicKey || !secretKey) return null;

  return {
    adminClient: createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    publicKey,
    url,
  };
}

export async function authenticateRequest(
  req: ApiRequest,
  clients: SupabaseServerClients,
): Promise<User | null> {
  const accessToken = getBearerToken(req);

  if (!accessToken) return null;

  const sessionClient = createClient(clients.url, clients.publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await sessionClient.auth.getUser();

  return error ? null : data.user;
}
