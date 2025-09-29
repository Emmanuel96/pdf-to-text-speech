import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import BookMarkCard from "@/assets/components/BookmarkCard";
import { useFocusEffect } from "@react-navigation/native";

type Bookmark = {
  id: string;
  index: number;
  timestamp: string;
  snippet: string;
};

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const router = useRouter();

useFocusEffect(
  React.useCallback(() => {
    let isActive = true;

    const fetchBookmarks = async () => {
      try {
        const data = await AsyncStorage.getItem("@bookmarks");
        if (data && isActive) {
          const parsed: Omit<Bookmark, "id">[] = JSON.parse(data);

          // ensure every bookmark has a unique id
          const withIds: Bookmark[] = parsed.map((bm, idx) => ({
            ...bm,
            id: `${bm.index}-${idx}-${bm.timestamp}`,
          }));

          setBookmarks(withIds);
        }
      } catch (err) {
        console.error("Failed to load bookmarks", err);
      }
    };

    fetchBookmarks();

    return () => {
      isActive = false; 
    };
  }, []) 
);

  const handleGoToBookmark = (bm: Bookmark) => {
    router.push({
      pathname: "/player",
      params: { bookmarkIndex: String(bm.index) },
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id} 
        renderItem={({ item }) => (
          <BookMarkCard
            timestamp={item.timestamp}
            snippet={item.snippet}
            onPress={() => handleGoToBookmark(item)}
          />
        )}
      />
    </View>
  );
}