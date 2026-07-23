import type { ServerResponse } from "node:http";
import type { ApiRequest } from "./http.js";
import { sendJson } from "./http.js";
import { isPushMessagingConfigured, sendPushMessage } from "./pushNotifications.js";
import { getSupabaseServerClients } from "./supabaseAdmin.js";

type ReminderMedia = {
  id: string;
  title: string;
  updated_at: string | null;
  user_id: string;
};

type PushDevice = {
  token: string;
  user_id: string;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1_000;

function isAuthorizedCronRequest(req: ApiRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.authorization === `Bearer ${secret}`;
}

function buildReminderBody(items: ReminderMedia[]) {
  const [first] = items;
  if (items.length === 1) return `Como está o andamento de “${first.title}”?`;

  return `Você tem ${items.length} obras em andamento. Como está “${first.title}”?`;
}

function getWeekStart() {
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
  return weekStart.toISOString().slice(0, 10);
}

export async function pushWeeklyReminders(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  if (!isAuthorizedCronRequest(req)) {
    sendJson(res, 401, { ok: false, message: "Não autorizado." });
    return;
  }

  const clients = getSupabaseServerClients();
  if (!clients || !isPushMessagingConfigured()) {
    sendJson(res, 503, { ok: false, message: "Serviço de notificações indisponível." });
    return;
  }

  const threshold = new Date(Date.now() - THREE_DAYS_MS).toISOString();
  const { data: media, error: mediaError } = await clients.adminClient
    .from("media_items")
    .select("id, title, updated_at, user_id")
    .eq("status", "in_progress")
    .lte("updated_at", threshold)
    .is("hidden_at", null)
    .order("updated_at", { ascending: true });

  if (mediaError) {
    console.error("[push-weekly-reminders] Failed to load media:", mediaError.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível consultar a biblioteca." });
    return;
  }

  const remindersByUser = new Map<string, ReminderMedia[]>();
  for (const item of (media ?? []) as ReminderMedia[]) {
    if (!item.user_id) continue;

    const items = remindersByUser.get(item.user_id) ?? [];
    items.push(item);
    remindersByUser.set(item.user_id, items);
  }

  if (remindersByUser.size === 0) {
    sendJson(res, 200, { ok: true, sent: 0 });
    return;
  }

  const userIds = [...remindersByUser.keys()];
  const { data: devices, error: devicesError } = await clients.adminClient
    .from("push_devices")
    .select("token, user_id")
    .in("user_id", userIds);

  if (devicesError) {
    console.error("[push-weekly-reminders] Failed to load devices:", devicesError.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível consultar os dispositivos." });
    return;
  }

  const tokensByUser = new Map<string, string[]>();
  for (const device of (devices ?? []) as PushDevice[]) {
    const tokens = tokensByUser.get(device.user_id) ?? [];
    tokens.push(device.token);
    tokensByUser.set(device.user_id, tokens);
  }

  const invalidTokens: string[] = [];
  const periodStart = getWeekStart();
  let sent = 0;

  for (const [userId, items] of remindersByUser) {
    const tokens = tokensByUser.get(userId) ?? [];
    if (tokens.length === 0) continue;

    const { data: delivery, error: deliveryError } = await clients.adminClient
      .from("notification_deliveries")
      .upsert({
        kind: "weekly_progress",
        period_start: periodStart,
        user_id: userId,
      }, { ignoreDuplicates: true, onConflict: "user_id,kind,period_start" })
      .select("id")
      .maybeSingle();

    if (deliveryError) {
      console.error("[push-weekly-reminders] Failed to reserve delivery:", deliveryError.message);
      continue;
    }

    if (!delivery) continue;

    const firstItem = items[0];
    const result = await sendPushMessage(tokens, {
      body: buildReminderBody(items),
      channelId: "horizon_library",
      route: items.length === 1 ? `/dossier/${firstItem.id}` : "/",
      tag: `weekly-progress-${userId}`,
      title: "Seu acervo está chamando",
    });

    invalidTokens.push(...result.invalidTokens);
    sent += result.sentCount;
  }

  if (invalidTokens.length > 0) {
    const { error } = await clients.adminClient
      .from("push_devices")
      .delete()
      .in("token", invalidTokens);

    if (error) console.warn("[push-weekly-reminders] Failed to remove expired tokens:", error.message);
  }

  sendJson(res, 200, { ok: true, sent });
}
