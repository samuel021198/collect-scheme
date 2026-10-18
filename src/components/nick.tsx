"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const KEY = "collect-scheme-nick";
const EVENT = "collect-scheme-nick";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readNick() {
  return window.localStorage.getItem(KEY) ?? "";
}

const NickContext = createContext<{
  nick: string;
  setNick: (nick: string) => void;
} | null>(null);

export function NickProvider({ children }: { children: React.ReactNode }) {
  const nick = useSyncExternalStore(subscribe, readNick, () => "");

  function setNick(next: string) {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }

  return <NickContext.Provider value={{ nick, setNick }}>{children}</NickContext.Provider>;
}

export function useNick() {
  const value = useContext(NickContext);
  if (!value) throw new Error("NickProvider missing");
  return value;
}
