import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function NativeBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener("backButton", () => {
      const backEvent = new Event("horizon:back", { cancelable: true });
      window.dispatchEvent(backEvent);

      if (backEvent.defaultPrevented) return;

      if (location.pathname === "/") {
        void CapacitorApp.exitApp();
        return;
      }

      navigate("/", { replace: true });
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}
