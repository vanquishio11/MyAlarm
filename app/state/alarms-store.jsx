/**
 * Alarms list state: holds alarms array and refresh. Screens use db + repository and call refresh after mutations.
 */

import { createContext, useContext, useState, useCallback } from "react";
import * as AlarmRepository from "../data/repositories/alarm-repository.js";

const AlarmsContext = createContext(null);

export function AlarmsProvider({ db, children }) {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const list = await AlarmRepository.listAlarms(db);
      setAlarms(list);
    } catch (e) {
      setError(e?.message || "Failed to load alarms");
    } finally {
      setLoading(false);
    }
  }, [db]);

  const value = { alarms, loading, error, refresh };
  return (
    <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>
  );
}

export function useAlarms() {
  const ctx = useContext(AlarmsContext);
  if (!ctx) throw new Error("useAlarms must be used within AlarmsProvider");
  return ctx;
}
