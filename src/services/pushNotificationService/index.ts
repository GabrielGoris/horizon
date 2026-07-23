import { Capacitor, type PermissionState } from "@capacitor/core";
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

  const response = await fetch(getApiUrl("/api/push-devices"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    }),
  });

  if (!response.ok) throw new Error("Não foi possível registrar este dispositivo para notificações.");
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
  await Promise.all([
    PushNotifications.createChannel({
      id: "horizon_library",
      name: "Biblioteca",
      description: "Lembretes sobre obras em andamento e sua wishlist.",
      importance: 3,
      vibration: true,
    }),
    PushNotifications.createChannel({
      id: "horizon_sync",
      name: "Sincronização",
      description: "Avisos sobre alterações offline e sincronização da biblioteca.",
      importance: 4,
      vibration: true,
    }),
    PushNotifications.createChannel({
      id: "horizon_updates",
      name: "Atualizações",
      description: "Novas versões disponíveis para o Horizon.",
      importance: 3,
      vibration: false,
    }),
    PushNotifications.createChannel({
      id: "horizon_account",
      name: "Conta",
      description: "Avisos importantes relacionados à sua conta.",
      importance: 4,
      vibration: true,
    }),
  ]);
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
      await fetch(getApiUrl("/api/push-devices"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
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

  const response = await fetch(getApiUrl("/api/push-test"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const result = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new Error(result?.message ?? "Não foi possível enviar a notificação de teste.");
}
