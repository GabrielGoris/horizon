type CheckEmailResponse = {
  exists?: boolean;
  message?: string;
};

export async function emailHasAccount(email: string) {
  const response = await fetch(getApiUrl("/api/check-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = await response.json() as CheckEmailResponse;

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível verificar o e-mail agora.");
  }

  return result.exists === true;
}
import { getApiUrl } from "../apiUrl";
