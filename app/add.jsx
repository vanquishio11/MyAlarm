import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { AlarmFormScreen } from "./ui/screens/AlarmFormScreen/AlarmFormScreen.jsx";

export default function AddAlarmPage() {
  const router = useRouter();
  useEffect(() => {
    router.setOptions({ title: "New alarm" });
  }, [router]);
  return <AlarmFormScreen />;
}
