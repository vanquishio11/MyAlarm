import { Stack } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { runMigrations } from "./data/db/connection.js";
import { AlarmsProvider } from "./state/alarms-store.jsx";
import { RingStateProvider } from "./state/ring-state.jsx";
import { NotificationListener } from "./NotificationListener.jsx";

function ProvidersWithDb({ children }) {
  const db = useSQLiteContext();
  return (
    <AlarmsProvider db={db}>
      <RingStateProvider>
        <NotificationListener />
        {children}
      </RingStateProvider>
    </AlarmsProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="alarms.db" onInit={runMigrations}>
      <ProvidersWithDb>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#1a1a1f" },
            headerTintColor: "#fafafa",
          }}
        >
          <Stack.Screen name="ring" options={{ headerShown: false }} />
        </Stack>
      </ProvidersWithDb>
    </SQLiteProvider>
  );
}
