import React, { useEffect } from "react";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { AlarmsScreen } from "./ui/screens/AlarmsScreen/AlarmsScreen.jsx";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.setOptions({
      title: "Alarms",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/add")}
          style={{ marginRight: 16 }}
          accessibilityLabel="Add alarm"
        >
          <Text style={{ fontSize: 24, color: "#fafafa" }}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [router]);

  return <AlarmsScreen />;
}
