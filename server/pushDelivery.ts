import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushMessage, type PushMessage } from "./pushNotifications.js";

type PushDevice = {
  token: string;
  user_id: string;
};

type DeliveryIdentity = {
  kind: string;
  periodStart: string;
  userId: string;
};

async function removeInvalidTokens(client: SupabaseClient, tokens: string[]) {
  if (!tokens.length) return;

  const { error } = await client.from("push_devices").delete().in("token", tokens);
  if (error) console.warn("[push-delivery] Failed to remove expired tokens:", error.message);
}

async function reserveDelivery(client: SupabaseClient, delivery: DeliveryIdentity) {
  const { data, error } = await client
    .from("notification_deliveries")
    .upsert({
      kind: delivery.kind,
      period_start: delivery.periodStart,
      user_id: delivery.userId,
    }, { ignoreDuplicates: true, onConflict: "user_id,kind,period_start" })
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function sendUserPushOnce(
  client: SupabaseClient,
  delivery: DeliveryIdentity,
  message: PushMessage,
) {
  const { data: devices, error: devicesError } = await client
    .from("push_devices")
    .select("token")
    .eq("user_id", delivery.userId);

  if (devicesError) throw devicesError;

  const tokens = (devices ?? []).map((device) => (device as Pick<PushDevice, "token">).token);
  if (!tokens.length || !(await reserveDelivery(client, delivery))) return { sentCount: 0 };

  const result = await sendPushMessage(tokens, message);
  await removeInvalidTokens(client, result.invalidTokens);

  return { sentCount: result.sentCount };
}

export async function sendGlobalPushOnce(
  client: SupabaseClient,
  delivery: Omit<DeliveryIdentity, "userId">,
  message: PushMessage,
) {
  const { data: devices, error: devicesError } = await client
    .from("push_devices")
    .select("token, user_id");

  if (devicesError) throw devicesError;

  const deviceRows = (devices ?? []) as PushDevice[];
  const userIds = [...new Set(deviceRows.map((device) => device.user_id))];
  const recipients = new Set<string>();

  for (let index = 0; index < userIds.length; index += 500) {
    const rows = userIds.slice(index, index + 500).map((userId) => ({
      kind: delivery.kind,
      period_start: delivery.periodStart,
      user_id: userId,
    }));
    const { data, error } = await client
      .from("notification_deliveries")
      .upsert(rows, { ignoreDuplicates: true, onConflict: "user_id,kind,period_start" })
      .select("user_id");

    if (error) throw error;
    for (const row of data ?? []) recipients.add((row as Pick<PushDevice, "user_id">).user_id);
  }

  const tokens = deviceRows
    .filter((device) => recipients.has(device.user_id))
    .map((device) => device.token);
  if (!tokens.length) return { sentCount: 0 };

  const result = await sendPushMessage(tokens, message);
  await removeInvalidTokens(client, result.invalidTokens);

  return { sentCount: result.sentCount };
}
