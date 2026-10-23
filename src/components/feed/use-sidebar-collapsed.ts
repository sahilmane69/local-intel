"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "local-intel-sidebar-collapsed";
const EVENT_KEY = "local-intel-sidebar";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT_KEY, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT_KEY, onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setCollapsed = useCallback((next: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(EVENT_KEY));
  }, []);

  return [collapsed, setCollapsed] as const;
}
