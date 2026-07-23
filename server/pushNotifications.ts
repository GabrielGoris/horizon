import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

type FirebaseServiceAccountJson = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

export type PushMessage = {
  body: string;
  channelId: "horizon_account" | "horizon_library" | "horizon_sync" | "horizon_updates";
  route?: string;
  tag: string;
  title: string;
};

function getServiceAccount(): ServiceAccount | null {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  const raw = encoded
    ? Buffer.from(encoded, "base64").toString("utf8")
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) return null;

  try {
    const account = JSON.parse(raw) as FirebaseServiceAccountJson;
    if (!account.project_id || !account.client_email || !account.private_key) return null;

    return {
      clientEmail: account.client_email,
      privateKey: account.private_key,
      projectId: account.project_id,
    };
  } catch {
    return null;
  }
}

function getFirebaseMessaging() {
  if (getApps().length > 0) return getMessaging();

  const account = getServiceAccount();
  if (!account) return null;

  return getMessaging(initializeApp({ credential: cert(account) }));
}

function getMessagingErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : "";
}

export async function sendPushMessage(tokens: string[], message: PushMessage) {
  const messaging = getFirebaseMessaging();
  if (!messaging || tokens.length === 0) {
    return { invalidTokens: [] as string[], sentCount: 0 };
  }

  const invalidTokens: string[] = [];
  let sentCount = 0;

  for (let index = 0; index < tokens.length; index += 500) {
    const batch = tokens.slice(index, index + 500);
    const response = await messaging.sendEachForMulticast({
      android: {
        notification: {
          channelId: message.channelId,
          sound: "default",
          tag: message.tag,
        },
        priority: "high",
      },
      data: message.route ? { route: message.route } : {},
      notification: {
        body: message.body,
        title: message.title,
      },
      tokens: batch,
    });

    sentCount += response.successCount;
    response.responses.forEach((result, responseIndex) => {
      const code = getMessagingErrorCode(result.error);
      if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
        invalidTokens.push(batch[responseIndex]);
      }
    });
  }

  return { invalidTokens, sentCount };
}

export function isPushMessagingConfigured() {
  return Boolean(getServiceAccount());
}
