import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getLastStatus,
  getProtectionEnabled,
  getUserKey,
  loadProfile,
  runCheckIn,
  setProtectionEnabled,
  touchActivity,
} from "../services/guardianTwinService";
import { getInactiveMinutes } from "../services/guardianTwinEngine";

const GuardianProtectionContext = createContext(null);

const CHECK_INTERVAL_MS = 3 * 60 * 1000;

export function GuardianProtectionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userKey = getUserKey(user);
  const [protectionOn, setProtectionOnState] = useState(() =>
    getProtectionEnabled(getUserKey(user))
  );
  const [lastStatus, setLastStatus] = useState(() => getLastStatus(getUserKey(user)));
  const [profile, setProfile] = useState(null);
  const watchId = useRef(null);
  const intervalId = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProfile(user).then(({ profile: p }) => setProfile(p));
    Promise.resolve().then(() => {
      setLastStatus(getLastStatus(userKey));
      setProtectionOnState(getProtectionEnabled(userKey));
    });
  }, [isAuthenticated, user, userKey]);

  const toggleProtection = useCallback(
    (enabled) => {
      setProtectionEnabled(userKey, enabled);
      setProtectionOnState(enabled);
    },
    [userKey]
  );

  const performCheck = useCallback(
    async (overrides = {}) => {
      const p = profileRef.current;
      if (!p || !isAuthenticated) return null;
      const inactive = getInactiveMinutes(userKey);
      const result = await runCheckIn(user, p, { ...overrides, inactiveMinutes: inactive });
      setLastStatus(result.ui);
      return result;
    },
    [user, userKey, isAuthenticated]
  );

  useEffect(() => {
    if (!isAuthenticated || !protectionOn || !profile) return;

    touchActivity(userKey);
    const onActivity = () => touchActivity(userKey);
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("mousemove", onActivity, { passive: true });

    performCheck().catch(() => {});

    intervalId.current = window.setInterval(() => {
      performCheck().catch(() => {});
    }, CHECK_INTERVAL_MS);

    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        () => touchActivity(userKey),
        () => {},
        { enableHighAccuracy: false, maximumAge: 30000 }
      );
    }

    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("mousemove", onActivity);
      if (intervalId.current) clearInterval(intervalId.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isAuthenticated, protectionOn, profile, userKey, performCheck]);

  const value = useMemo(
    () => ({
      protectionOn,
      toggleProtection,
      lastStatus,
      profile,
      setProfile,
      performCheck,
      refreshStatus: () => setLastStatus(getLastStatus(userKey)),
    }),
    [protectionOn, toggleProtection, lastStatus, profile, performCheck, userKey]
  );

  return (
    <GuardianProtectionContext.Provider value={value}>
      {children}
    </GuardianProtectionContext.Provider>
  );
}

export function useGuardianProtection() {
  const ctx = useContext(GuardianProtectionContext);
  if (!ctx) {
    throw new Error("useGuardianProtection must be used within GuardianProtectionProvider");
  }
  return ctx;
}
