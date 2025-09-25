import { Ionicons } from "@expo/vector-icons";
import { Stack, Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{headerShown: true, tabBarActiveTintColor: '#ff6f00'}}>
      <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        tabBarIcon: ({color, size}) => (
          <Ionicons name="document-text" size={size} color={color}/>
        ),
      }}
      />

      <Tabs.Screen
      name="player"
      options={{
        title: 'AudioPlayer',
        tabBarIcon: ({color, size}) => (
          <Ionicons name="play-circle" size={size} color={color}/>
        ),
      }}
      />

      <Tabs.Screen
      name="bookmarks"
      options={{
        title: "Bookmarks",
        tabBarIcon: ({color, size}) => (
          <Ionicons name="bookmark" size={size} color={color}/>
        )
      }}
      />
    </Tabs>
  )
}
