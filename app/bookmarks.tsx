import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import BookMarkCard from "@/assets/components/BookmarkCard";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";
import { 
  ExpoSpeechRecognitionModule,
  addSpeechRecognitionListener,
  ExpoWebSpeechRecognition,
  isRecognitionAvailable

 } from 'expo-speech-recognition';



type Bookmark = {
  id: string;
  index: number;
  timestamp: string;
  snippet: string;
  notes?: string[],
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

//update bookmark with notes

const updatedBookmark = async (bm: Bookmark) => {
  const key = '@bookmarks';
  const stored = await AsyncStorage.getItem(key);
  const bookmarks: Bookmark[] = stored ? JSON.parse(stored) : [];
  const updated = bookmarks.map((b) => (b.id === bm.id ? bm : b));
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  setBookmarks(updated);
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Track global recognizer to avoid overlap
let activeRecognition: any = null;

const startConversation = async (bm: any) => {
  try {
    console.log("Conversation started");

    // Stop any existing recognition
    if (activeRecognition) {
      console.log("Stopping previous recognition...");
      try {
        activeRecognition.stop();
      } catch (e) {}
    }

    const available = isRecognitionAvailable();
    if (!available) {
      Alert.alert("Speech Recognition not available");
      return;
    }

    // Wait until speech is done before listening
    await new Promise<void>((resolve) => {
      Speech.speak("Do you want to add a note to this bookmark? Say yes or no.", {
        onDone: resolve,
      });
    });

    // Small buffer before listening (important)
    await wait(2000);

    const recognition = new ExpoWebSpeechRecognition();
    activeRecognition = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Heard:", transcript);
      recognition.stop();

      if (transcript.includes("yes")) {
        // Wait until speech finishes before next recognition
        await new Promise<void>((resolve) => {
          Speech.speak("Okay, please say your note now.", { onDone: resolve });
        });

        await wait(2000);

        const noteRecog = new ExpoWebSpeechRecognition();
        activeRecognition = noteRecog;
        noteRecog.lang = "en-US";
        noteRecog.continuous = false;

        noteRecog.onresult = async (noteEvent) => {
          const note = noteEvent.results[0][0].transcript;
          console.log("Note:", note);

          const updated = { ...bm, notes: [...(bm.notes || []), note] };
          await updatedBookmark(updated);

          Speech.speak(`Got it. I saved your note: ${note}`);
          noteRecog.stop();
          activeRecognition = null;
        };

        noteRecog.onerror = (err) => console.error("Note recognition error:", err);
        noteRecog.start();

      } else if (transcript.includes("no")) {
        Speech.speak("Okay. No notes added.");

      } else {
        Speech.speak("Sorry, I didn’t catch that. Please say yes or no next time.");
      }
    };

    recognition.onerror = (err) => console.error("Speech error:", err);
    recognition.onend = () => console.log("Conversation ended");

    recognition.start();
  } catch (error) {
    console.error("Speech Error:", error);
  }
};

  const handleGoToBookmark = (bm: Bookmark) => {
    router.push({
      pathname: "/player",
      params: { bookmarkIndex: String(bm.index) },
    });
  };

  const handleDeleteBookmark = async (id: string) => {
    Alert.alert("Delete Bookmark ", "Are you sure?", [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = bookmarks.filter((bm) => bm.id !== id);
            setBookmarks(updated);

            await AsyncStorage.setItem('@bookmarks', JSON.stringify(updated));

          } catch (err) {
            console.error("Failed to delete bookmark", err);
          }
        }
      }
    ])
  }

  const handleShare = async (bm: Bookmark) => {
    try {
      await Share.share({
        message: `Bookmark at ${bm.timestamp}\n\n${bm.snippet}`,
      });
    } catch (error) {
      console.error("Error sharing bookmark", error);
    }
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
            onShare={() => handleShare(item)}
            onTalk={() => startConversation(item)}
            onLongPress={() => handleDeleteBookmark(item.id)}
          />
        )}
      />
    </View>
  );
}