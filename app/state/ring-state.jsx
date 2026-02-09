/**
 * Currently ringing alarm. Set when notification fires or we show Ring screen; clear when dismissed.
 */

import { createContext, useContext, useState } from "react";

const RingStateContext = createContext(null);

export function RingStateProvider({ children }) {
  const [ringingAlarm, setRingingAlarm] = useState(null); // Alarm or null
  const [attemptCount, setAttemptCount] = useState(0);

  const setRinging = (alarm) => {
    setRingingAlarm(alarm);
    setAttemptCount(0);
  };

  const clearRinging = () => {
    setRingingAlarm(null);
    setAttemptCount(0);
  };

  const recordFailedAttempt = () => {
    setAttemptCount((c) => c + 1);
  };

  const value = {
    ringingAlarm,
    attemptCount,
    setRinging,
    clearRinging,
    recordFailedAttempt,
  };
  return (
    <RingStateContext.Provider value={value}>{children}</RingStateContext.Provider>
  );
}

export function useRingState() {
  const ctx = useContext(RingStateContext);
  if (!ctx) throw new Error("useRingState must be used within RingStateProvider");
  return ctx;
}
