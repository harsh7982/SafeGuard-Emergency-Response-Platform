import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient, { TOKEN_KEY } from "../api/client";

const USER_KEY = "safeher_user";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isLoadingUser, setIsLoadingUser] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;

    apiClient
      .get("/api/user/me")
      .then(({ data }) => {
        if (isCurrent) {
          setUser(data);
          localStorage.setItem(USER_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {
        if (isCurrent) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingUser(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const login = async (credentials) => {
    const { data } = await apiClient.post("/api/auth/login", credentials);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setIsLoadingUser(true);
    setToken(data.accessToken);
    return data;
  };

  const register = async (details) => {
    const { data } = await apiClient.post("/api/auth/register", details);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsLoadingUser(false);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isLoadingUser,
      login,
      logout,
      register,
      user,
    }),
    [token, user, isLoadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
