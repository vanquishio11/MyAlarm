import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useRingState } from "./state/ring-state.jsx";
import * as AlarmRepository from "./data/repositories/alarm-repository.js";

export function NotificationListener() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { setRinging } = useRingState();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const handleNotification = async (notification) => {
      const alarmId = notification?.request?.content?.data?.alarmId;
      if (!alarmId || !db || !mounted.current) return;
      try {
        const alarm = await AlarmRepository.getAlarm(db, alarmId);
        if (mounted.current) {
          setRinging(alarm);
          router.replace("/ring");
        }
      } catch (_) {}
    };

    const received = Notifications.addNotificationReceivedListener(handleNotification);
    const response = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotification(response.notification);
    });

    return () => {
      mounted.current = false;
      received.remove();
      response.remove();
    };
  }, [db, setRinging, router]);

  return null;
}
