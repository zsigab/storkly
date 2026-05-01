import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { TokenResponse } from "@/api";

const STORAGE_KEY = "storkly-user";

interface AuthContextValue {
  user: TokenResponse | null;
  login: (user: TokenResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): TokenResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "id" in parsed &&
      "email" in parsed &&
      "displayName" in parsed &&
      typeof (parsed as Record<string, unknown>)["id"] === "string" &&
      typeof (parsed as Record<string, unknown>)["email"] === "string" &&
      typeof (parsed as Record<string, unknown>)["displayName"] === "string"
    ) {
      return parsed as TokenResponse;
    }
  } catch {
    // Ignore malformed stored data
  }
  return null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<TokenResponse | null>(readStoredUser);

  const login = (u: TokenResponse): void => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
    window.addEventListener("storkly:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("storkly:unauthorized", handleUnauthorized);
  }, []);

  return createElement(AuthContext.Provider, { value: { user, login, logout } }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
