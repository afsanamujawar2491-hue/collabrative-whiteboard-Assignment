import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import keycloak from "./keycloak";
import { setTokenProvider } from "../services/api";
import { setSocketTokenProvider } from "../services/socket";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | undefined;
  isAuthenticated: boolean;
  loading: boolean;
  login: (redirectUri?: string) => void;
  register: (redirectUri?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshAuth = useCallback(() => {
    if (!keycloak.authenticated) {
      setUser(null);
      setToken(undefined);
      setIsAuthenticated(false);
      return;
    }
    setToken(keycloak.token);
    setIsAuthenticated(true);
    setUser({
      id: keycloak.subject || "",
      username:
        keycloak.tokenParsed?.preferred_username ||
        keycloak.tokenParsed?.name ||
        "User",
      email: keycloak.tokenParsed?.email || "",
    });
  }, []);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        if (authenticated) refreshAuth();
        setLoading(false);
      })
      .catch(() => setLoading(false));

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).then((refreshed) => {
        if (refreshed) refreshAuth();
      });
    };

    keycloak.onAuthSuccess = () => refreshAuth();
    keycloak.onAuthLogout = () => refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    const provider = () => keycloak.token;
    setTokenProvider(provider);
    setSocketTokenProvider(provider);
  }, [token]);

  const login = useCallback((redirectUri?: string) => {
    keycloak.login({
      redirectUri: redirectUri || window.location.href,
    });
  }, []);

  const register = useCallback((redirectUri?: string) => {
    keycloak.register({
      redirectUri: redirectUri || window.location.href,
    });
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
