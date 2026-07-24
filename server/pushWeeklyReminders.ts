import type { ServerResponse } from "node:http";
import type { ApiRequest } from "./http.js";
import { sendJson } from "./http.js";
import { isPushMessagingConfigured, sendPushMessage } from "./pushNotifications.js";
import { getSupabaseServerClients } from "./supabaseAdmin.js";

type ReminderCandidate = {
  item_count: number | string;
  media_id: string;
  title: string;
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

function buildReminderBody(item: ReminderCandidate) {
  const itemCount = Number(item.item_count);
  if (itemCount <= 1) return `Como está o andamento de “${item.title}”?`;

  return `Você tem ${itemCount} obras em andamento. Como está “${item.title}”?`;
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
  const periodStart = getWeekStart();
  const { data: candidates, error: candidatesError } = await clients.adminClient.rpc(
    "get_weekly_progress_reminders",
    { p_period_start: periodStart, p_threshold: threshold },
  );

  let reminders = (candidates ?? []) as ReminderCandidate[];

  if (candidatesError) {
    console.warn("[push-weekly-reminders] Efficient candidate query unavailable:", candidatesError.message);
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

    const grouped = new Map<string, Array<{ id: string; title: string }>>();
    for (const item of (media ?? []) as Array<{ id: string; title: string; user_id: string }>) {
      const items = grouped.get(item.user_id) ?? [];
      items.push(item);
      grouped.set(item.user_id, items);
    }

    reminders = [...grouped.entries()].map(([userId, items]) => ({
      item_count: items.length,
      media_id: items[0].id,
      title: items[0].title,
      user_id: userId,
    }));
  }
  if (reminders.length === 0) {
    sendJson(res, 200, { ok: true, sent: 0 });
    return;
  }

  const userIds = reminders.map((item) => item.user_id);
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
  let sent = 0;

  for (const item of reminders) {
    const tokens = tokensByUser.get(item.user_id) ?? [];
    if (tokens.length === 0) continue;

    const { data: delivery, error: deliveryError } = await clients.adminClient
      .from("notification_deliveries")
      .upsert({
        kind: "weekly_progress",
        period_start: periodStart,
        user_id: item.user_id,
      }, { ignoreDuplicates: true, onConflict: "user_id,kind,period_start" })
      .select("id")
      .maybeSingle();

    if (deliveryError) {
      console.error("[push-weekly-reminders] Failed to reserve delivery:", deliveryError.message);
      continue;
    }

    if (!delivery) continue;

    const result = await sendPushMessage(tokens, {
      body: buildReminderBody(item),
      channelId: "horizon_library",
      route: Number(item.item_count) === 1 ? `/dossier/${item.media_id}` : "/",
      tag: `weekly-progress-${item.user_id}`,
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
