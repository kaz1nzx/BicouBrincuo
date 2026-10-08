"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { demoMode } from "@/lib/config";
import { demoState, emptyState } from "@/lib/seed";
import { execute } from "@/lib/engine";
import type { State } from "@/lib/types";
export const DEMO_KEY = "bicou-brincou-demo-v1";
export function readDemo() {
  const raw = localStorage.getItem(DEMO_KEY);
  return raw ? (JSON.parse(raw) as State) : demoState();
}
const Context = createContext<{
  state: State;
  loading: boolean;
  busy: boolean;
  demo: boolean;
  error: string;
  message: string;
  run: (command: Record<string, unknown>) => Promise<void>;
  notify: (message: string) => void;
}>({
  state: emptyState(),
  loading: true,
  busy: false,
  demo: true,
  error: "",
  message: "",
  run: async () => {},
  notify: () => {},
});
export function Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(emptyState()),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const demo = demoMode();
  const reload = useCallback(async () => {
    try {
      if (demo) setState(readDemo());
      else {
        const response = await fetch("/api/admin/state", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setState(data.state);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }, [demo]);
  useEffect(() => {
    void reload();
    const storage = (e: StorageEvent) => {
      if (demo && e.key === DEMO_KEY) void reload();
    };
    window.addEventListener("storage", storage);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      void navigator.serviceWorker.register("/sw.js");
    return () => window.removeEventListener("storage", storage);
  }, [reload, demo]);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const run = useCallback(
    async (command: Record<string, unknown>) => {
      if (lock.current) throw new Error("Aguarde a operação atual.");
      lock.current = true;
      setBusy(true);
      setError("");
      try {
        const input = { ...command, requestId: crypto.randomUUID() };
        if (demo) {
          const next = execute(readDemo(), input);
          localStorage.setItem(DEMO_KEY, JSON.stringify(next));
          setState(next);
        } else {
          const response = await fetch("/api/admin/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setState(data.state);
        }
        setMessage("Operação salva com sucesso.");
      } catch (e) {
        const text =
          e instanceof Error ? e.message : "Não foi possível salvar.";
        setError(text);
        throw e;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [demo],
  );
  return (
    <Context.Provider
      value={{
        state,
        loading,
        busy,
        demo,
        error,
        message,
        run,
        notify: setMessage,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
