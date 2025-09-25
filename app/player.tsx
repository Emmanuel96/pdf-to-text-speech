import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import Slider from "@react-native-community/slider";

export default function Player() {
  const [text, setText] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0); // seconds
  const [duration, setDuration] = useState(300); // fake total duration for now (5 min)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load last text
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("@lastPdfText");
      if (t) setText(t);
    })();
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlay = () => {
    if (!text) return;
    Speech.speak(text, {
      onDone: () => {
        setIsPlaying(false);
        clearInterval(intervalRef.current!);
      },
      onStopped: () => {
        setIsPlaying(false);
        clearInterval(intervalRef.current!);
      },
    });
    setIsPlaying(true);

    // fake progress
    intervalRef.current = setInterval(() => {
      setPosition((p) => {
        if (p >= duration) {
          clearInterval(intervalRef.current!);
          return duration;
        }
        return p + 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    Speech.stop();
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSeek = (val: number) => {
    setPosition(val);
    // ❗ Here later you’ll sync this with TTS chunk reading
  };

  const handleSkip = (amount: number) => {
    let newPos = position + amount;
    if (newPos < 0) newPos = 0;
    if (newPos > duration) newPos = duration;
    setPosition(newPos);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const remaining = duration - position;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Cover Art */}
      <Image
        source={{ uri: "https://i.ibb.co/sH8Kcyc/fourth-wing.jpg" }}
        style={styles.cover}
      />

      {/* Slider */}
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
        <Text style={{ fontWeight: "600" }}>
          {Math.floor(remaining / 60)} minutes Remaining
        </Text>
        <Text>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => handleSkip(-30)}>
          <Text style={styles.skip}>⏪ 30</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? handleStop : handlePlay}
        >
          <Text style={styles.playText}>{isPlaying ? "⏸" : "▶️"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleSkip(30)}>
          <Text style={styles.skip}>30 ⏩</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <TouchableOpacity>
          <Text>1x</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>🔖</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>📝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  topBar: { flexDirection: "row", justifyContent: "flex-start", marginBottom: 12 },
  cover: { width: 280, height: 280, alignSelf: "center", borderRadius: 10, marginBottom: 20 },
  slider: { width: "100%", height: 40 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 20 },
  skip: { fontSize: 18, marginHorizontal: 20 },
  playButton: {
    backgroundColor: "#FF6600",
    padding: 20,
    borderRadius: 50,
    marginHorizontal: 20,
  },
  playText: { fontSize: 22, color: "white", fontWeight: "bold" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },
});
