import { Capacitor, CapacitorHttp, type PermissionState } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type { Session } from "@supabase/supabase-js";
import { getApiUrl } from "../apiUrl";

const PUSH_TOKEN_STORAGE_KEY = "horizon-push-token";
export const PUSH_NAVIGATION_EVENT = "horizon:push-navigation";

type PushNavigationDetail = { route: string };

let currentAccessToken = "";
let listenersReady = false;

function isAndroidNativeApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

type PushApiResponse = {
  data: { message?: string } | null;
  ok: boolean;
};

async function requestPushApi(path: string, options: { body?: Record<string, unknown>; method: "DELETE" | "POST" }) {
  const headers = {
    Authorization: `Bearer ${currentAccessToken}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };

  if (isAndroidNativeApp()) {
    const response = await CapacitorHttp.request({
      data: options.body,
      headers,
      method: options.method,
      responseType: "json",
      url: getApiUrl(path),
    });

    return {
      data: response.data && typeof response.data === "object" ? response.data as { message?: string } : null,
      ok: response.status >= 200 && response.status < 300,
    } satisfies PushApiResponse;
  }

  const response = await fetch(getApiUrl(path), {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers,
    method: options.method,
  });
  const data = await response.json().catch(() => null) as { message?: string } | null;

  return { data, ok: response.ok } satisfies PushApiResponse;
}

function getSafeRoute(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;

  return value;
}

function emitPushNavigation(data: unknown) {
  if (!data || typeof data !== "object") return;

  const route = getSafeRoute((data as { route?: unknown }).route);
  if (!route) return;

  window.dispatchEvent(new CustomEvent<PushNavigationDetail>(PUSH_NAVIGATION_EVENT, { detail: { route } }));
}

async function savePushDevice(token: string) {
  if (!currentAccessToken) return;

  const response = await requestPushApi("/api/push-devices", {
    body: {
      token,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    method: "POST",
  });

  if (!response.ok) throw new Error(response.data?.message ?? "Não foi possível registrar este dispositivo para notificações.");
}

async function ensureListeners() {
  if (listenersReady) return;
  listenersReady = true;

  await PushNotifications.addListener("registration", ({ value }) => {
    localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, value);
    void savePushDevice(value).catch((error) => console.warn("Falha ao registrar notificações push.", error));
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.warn("Falha ao registrar notificações push.", error.error);
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
    emitPushNavigation(notification.data);
  });
}

async function createNotificationChannels() {
  await PushNotifications.createChannel({
    id: "horizon_library",
    name: "Biblioteca",
    description: "Lembretes sobre obras em andamento e sua wishlist.",
    importance: 3,
    vibration: true,
  });
}

export async function getPushPermissionState(): Promise<PermissionState | "unsupported"> {
  if (!isAndroidNativeApp()) return "unsupported";

  const status = await PushNotifications.checkPermissions();
  return status.receive;
}

export async function initializePushNotifications(session: Session) {
  if (!isAndroidNativeApp()) return "unsupported" as const;

  currentAccessToken = session.access_token;
  await ensureListeners();
  await createNotificationChannels();

  let permission = await getPushPermissionState();
  if (permission === "prompt" || permission === "prompt-with-rationale") {
    const requested = await PushNotifications.requestPermissions();
    permission = requested.receive;
  }

  if (permission !== "granted") return permission;

  const cachedToken = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (cachedToken) void savePushDevice(cachedToken).catch((error) => console.warn("Falha ao atualizar o dispositivo de notificações.", error));

  await PushNotifications.register();
  return permission;
}

export async function unregisterPushNotifications(session: Session) {
  if (!isAndroidNativeApp()) return;

  currentAccessToken = session.access_token;
  const token = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

  if (token) {
    try {
      await requestPushApi("/api/push-devices", {
        body: { token },
        method: "DELETE",
      });
    } finally {
      localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  }

  await PushNotifications.unregister();
  currentAccessToken = "";
}

export async function sendPushNotificationTest(session: Session) {
  if (!isAndroidNativeApp()) throw new Error("O teste de notificações está disponível apenas no aplicativo Android.");

  currentAccessToken = session.access_token;
  const response = await requestPushApi("/api/push-test", { method: "POST" });

  if (!response.ok) throw new Error(response.data?.message ?? "Não foi possível enviar a notificação de teste.");
}
