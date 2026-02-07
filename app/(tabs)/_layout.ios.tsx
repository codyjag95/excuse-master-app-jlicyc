
import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  // Single screen app - no tabs needed
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen key="home" name="(home)" />
    </Stack>
  );
}
