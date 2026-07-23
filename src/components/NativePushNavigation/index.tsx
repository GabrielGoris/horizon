import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PUSH_NAVIGATION_EVENT } from "../../services/pushNotificationService";

export function NativePushNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePushNavigation = (event: Event) => {
      const route = (event as CustomEvent<{ route?: unknown }>).detail?.route;
      if (typeof route === "string" && route.startsWith("/") && !route.startsWith("//")) {
        navigate(route);
      }
    };

    window.addEventListener(PUSH_NAVIGATION_EVENT, handlePushNavigation);
    return () => window.removeEventListener(PUSH_NAVIGATION_EVENT, handlePushNavigation);
  }, [navigate]);

  return null;
}
