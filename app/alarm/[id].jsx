import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlarmFormScreen } from "../../ui/screens/AlarmFormScreen/AlarmFormScreen.jsx";

export default function EditAlarmPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  useEffect(() => {
    router.setOptions({ title: "Edit alarm" });
  }, [router]);
  return <AlarmFormScreen alarmId={id} />;
}
