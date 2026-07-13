import { useEffect, useRef } from 'react';
import type { CaptchaFieldProps } from './types';

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const scriptId = 'cloudflare-turnstile-script';

type TurnstileApi = {
  remove: (widgetId: string) => void;
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile indisponivel.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile indisponivel.')), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function CaptchaField({ onTokenChange, resetKey }: CaptchaFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      onTokenChange(null);
      return;
    }

    let widgetId: string | null = null;
    let isCancelled = false;
    const container = containerRef.current;

    onTokenChange(null);
    void loadTurnstile()
      .then(() => {
        if (isCancelled || !window.turnstile) return;

        widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token: string) => onTokenChange(token),
          'error-callback': () => onTokenChange(null),
          'expired-callback': () => onTokenChange(null),
        });
      })
      .catch(() => onTokenChange(null));

    return () => {
      isCancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onTokenChange, resetKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Verificacao de seguranca" />;
}
