import { useEffect, useRef } from "react";

const EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;

/**
 * Signs the user out after `minutes` of inactivity, honouring the session
 * timeout configured in security settings. A value of 0 disables the timer.
 */
export function useIdleLogout(minutes: number, onTimeout: () => void) {
  const callback = useRef(onTimeout);
  callback.current = onTimeout;

  useEffect(() => {
    if (!minutes || minutes <= 0) return;
    const limit = minutes * 60_000;
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(), limit);
    };

    reset();
    for (const event of EVENTS) window.addEventListener(event, reset, { passive: true });
    return () => {
      clearTimeout(timer);
      for (const event of EVENTS) window.removeEventListener(event, reset);
    };
  }, [minutes]);
}
