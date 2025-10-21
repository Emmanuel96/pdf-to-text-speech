import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams } from "expo-router";

export default function PlayerScreen() {
  const [text, setText] = useState<string>("");
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const durationsRef = useRef<number[]>([]);
  const startsRef = useRef<number[]>([]);

  const AVG_WORD_DURATION = 60 / 150; // ~150 wpm

  
  const { id, uri, name, coverUri, bookmarkIndex } = useLocalSearchParams<{
    id?: string;
    uri?: string;
    name?: string;
    coverUri?: string;
    bookmarkIndex?: string;
  }>();

  // load text from AsyncStorage using the correct key
  useEffect(() => {
    if (!id) return;

    setChunks([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setPosition(0);

    const loadPdfText = async () => {
      try {
        const t = await AsyncStorage.getItem(`@pdf-text-${id}`);
        if (t) {
          setText(t);
          const parts = t.match(/[^.!?]+[.!?]+/g) || [t];
          setChunks(parts);
          loadBookmarks();
        }
      } catch (err) {
        console.warn("Failed to load PDF text", err);
      }
    };

    loadPdfText();
  }, [id]);

  const loadBookmarks = async () => {
    if (!id) return;
    const key = `@bookmarks-${id}`;
    const stored = await AsyncStorage.getItem(key);
    setBookmarks(stored ? JSON.parse(stored) : []);
  };

  // jump to bookmark if passed in
  useEffect(() => {
    if (!bookmarkIndex) return;
    if (!chunks.length) return;

    const idx = parseInt(bookmarkIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= chunks.length) return;

    stopSpeechAndTimers();
    setCurrentIndex(idx);
    setPosition(startsRef.current[idx] ?? 0);
    setIsPlaying(true);
    playChunk(idx, 0);
  }, [bookmarkIndex, chunks]);

  // recompute durations when chunks change
  useEffect(() => {
    if (!chunks.length) {
      durationsRef.current = [];
      startsRef.current = [];
      setDuration(0);
      setPosition(0);
      return;
    }

    const durations = chunks.map((c) => {
      const words = c.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words * AVG_WORD_DURATION));
    });

    durationsRef.current = durations;

    const starts: number[] = [];
    let acc = 0;
    for (let i = 0; i < durations.length; i++) {
      starts.push(acc);
      acc += durations[i];
    }
    startsRef.current = starts;

    setDuration(acc);
    setPosition((prev) => Math.min(prev, acc));
  }, [chunks]);

  useEffect(() => {
    return () => stopSpeechAndTimers();
  }, []);

  const stopSpeechAndTimers = () => {
    try {
      Speech.stop();
    } catch {}
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    intervalRef.current = null;
    speakTimeoutRef.current = null;
  };

  const findChunkIndexByPosition = (pos: number) => {
    const starts = startsRef.current;
    for (let i = starts.length - 1; i >= 0; i--) {
      if (pos >= starts[i]) return i;
    }
    return 0;
  };

  const playChunk = (index: number, offsetSeconds = 0) => {
    stopSpeechAndTimers();

    if (!chunks || index >= chunks.length) {
      setIsPlaying(false);
      if (chunks && index >= chunks.length) setPosition(duration);
      return;
    }

    const chunk = chunks[index] ?? "";
    const words = chunk.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return playChunk(index + 1, 0);

    const startWordIndex = Math.max(0, Math.floor(offsetSeconds / AVG_WORD_DURATION));
    if (startWordIndex >= words.length) return playChunk(index + 1, 0);

    const speakText = words.slice(startWordIndex).join(" ");
    const estimatedSeconds = Math.max(1, Math.ceil((words.length - startWordIndex) * AVG_WORD_DURATION));

    const chunkStart = startsRef.current[index] ?? 0;
    const startPositionApprox = Math.round(chunkStart + startWordIndex * AVG_WORD_DURATION);

    setCurrentIndex(index);
    setPosition(startPositionApprox);
    setIsPlaying(true);

    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed++;
      setPosition((prev) => Math.min(prev + 1, duration));
      if (elapsed >= estimatedSeconds) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 1000);

    speakTimeoutRef.current = setTimeout(() => {
      Speech.speak(speakText, {
        onDone: () => {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          const finishPos = Math.round(chunkStart + estimatedSeconds);
          setPosition((prev) => (finishPos > prev ? Math.min(finishPos, duration) : prev));
          if (index + 1 < chunks.length) playChunk(index + 1, 0);
          else setIsPlaying(false);
        },
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }, 80);
  };

  const handlePlay = () => {
    if (!chunks.length) return;
    const offset = Math.max(0, position - (startsRef.current[currentIndex] ?? 0));
    playChunk(currentIndex, offset);
  };

  const handlePause = () => {
    Platform.OS === "ios" ? Speech.pause?.() : Speech.stop();
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setIsPlaying(false);
  };

  const handleResume = () => {
    if (!chunks.length) return;
    if (Platform.OS === "ios" && Speech.resume) {
      Speech.resume();
      setIsPlaying(true);
      return;
    }
    const idx = findChunkIndexByPosition(position);
    const offset = Math.max(0, position - (startsRef.current[idx] ?? 0));
    setCurrentIndex(idx);
    playChunk(idx, offset);
  };

  const handleStop = () => {
    stopSpeechAndTimers();
    setIsPlaying(false);
    setCurrentIndex(0);
    setPosition(0);
  };

  const handleSeek = (val: number) => {
    const clamped = Math.max(0, Math.min(Math.round(val), duration));
    setPosition(clamped);
    const idx = findChunkIndexByPosition(clamped);
    const offset = clamped - (startsRef.current[idx] ?? 0);
    setCurrentIndex(idx);
    if (isPlaying) playChunk(idx, offset);
    else stopSpeechAndTimers();
  };

  const handleSkip = (amount: number) => handleSeek(position + amount);

  
  const handleAddBookmark = async () => {
  const newBookmark = {
    id: Date.now().toString(), // 👈 unique id
    index: currentIndex,
    timestamp: formatTime(position),
    snippet: chunks[currentIndex]?.slice(0, 150) + "...",
    notes: [],
  };

  try {
    const stored = await AsyncStorage.getItem("@bookmarks");
    let existing = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(existing)) {
      existing = [];
    }

    const updated = [...existing, newBookmark];
    await AsyncStorage.setItem("@bookmarks", JSON.stringify(updated));
    console.log("Bookmark saved:", updated);
  } catch (error) {
    console.error("Error saving bookmark:", error);
  }
};

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60).toString().padStart(2, "0")}:${Math.floor(sec % 60)
      .toString()
      .padStart(2, "0")}`;

  const remaining = duration - position;

  async function clearAllStorage() {
    try {
      await AsyncStorage.clear();
      console.log("All AsyncStorage cleared!");
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: coverUri || "https://i.ibb.co/sH8Kcyc/fourth-wing.jpg" }}
        style={styles.cover}
      />
      <Text style={styles.title}>Currently Playing: {name || "Untitled PDF"}</Text>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        minimumTrackTintColor="#FF6600"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#FF6600"
        onSlidingComplete={handleSeek}
      />

      <View style={styles.timeRow}>
        <Text>{formatTime(position)}</Text>
        <Text style={{ fontWeight: "600" }}>{Math.floor(remaining / 60)} min Remaining</Text>
        <Text>{formatTime(duration)}</Text>
      </View>

      {/* --- existing controls unchanged --- */}
      <View style={styles.controls}>
        <View style={styles.mainControls}>
          <TouchableOpacity onPress={() => handleSkip(-30)}>
            <Text style={styles.skip}>⏪ 30</Text>
          </TouchableOpacity>

          {isPlaying ? (
            <TouchableOpacity style={styles.playButton} onPress={handlePause}>
              <Text style={styles.playText}>⏸</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
              <Text style={styles.playText}>▶️</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => handleSkip(30)}>
            <Text style={styles.skip}>30 ⏩</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryControls}>
          <TouchableOpacity style={styles.smallButton} onPress={handleResume}>
            <Text style={styles.smallText}>⏯ Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={handleStop}>
            <Text style={styles.smallText}>⏹ Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={handleAddBookmark}>
            <Text style={styles.smallText}>🔖 Bookmark</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  cover: { width: "100%", height: 220, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 20 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  controls: { marginTop: "auto", paddingVertical: 70 },
  mainControls: { flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", marginBottom: 20 },
  skip: { fontSize: 16, fontWeight: "500" },
  playButton: { backgroundColor: "#FF6600", borderRadius: 50, width: 70, height: 70, justifyContent: "center", alignItems: "center" },
  playText: { fontSize: 32, color: "#fff" },
  secondaryControls: { flexDirection: "row", justifyContent: "space-around" },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#eee", borderRadius: 8 },
  smallText: { fontSize: 14, fontWeight: "500" },
  slider: { marginTop: 90 },
});

