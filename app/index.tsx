import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import UploadButton from "@/assets/components/UploadButton";
import PdfCard, { PdfItem } from "@/assets/components/PdfCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { uploadAndExtractText } from "@/utils/pdfUtils";

const STORAGE_KEY = "@pdfs";

export default function HomeScreen() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔹 Load saved PDFs on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const arr: PdfItem[] = raw ? JSON.parse(raw) : [];
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        setItems(arr);
      } catch (err) {
        console.warn("Failed to load saved PDFs", err);
      }
    })();
  }, []);

  // 🔹 Save to AsyncStorage + update state
  const persistItems = async (next: PdfItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
    } catch (err) {
      console.warn("Failed to persist PDFs", err);
    }
  };

  // 🔹 Handle new upload
  const onPick = async (asset: any) => {
    if (!asset?.uri) return;

    setLoading(true);
    try {
      // 1. Upload PDF to backend and extract text
      const result = await uploadAndExtractText(
        asset.uri,
        asset.name || "document.pdf"
      );
      const text = result.text || "";

      // 2. Generate unique ID for this PDF
      const id = Date.now().toString();

      // 3. Save extracted text for Player
      await AsyncStorage.setItem(`@pdf-text-${id}`, text);

      // 4. Save PDF metadata
      const item: PdfItem = {
        id,
        name: asset.name ?? "document.pdf",
        uri: asset.uri,
        createdAt: new Date().toISOString(),
        coverUri: null,
      };

      const next = [item, ...items].slice(0, 20);
      await persistItems(next);
      console.log("Saved PDF + text:", item.name);
    } catch (err) {
      console.warn("Failed to process PDF", err);
      Alert.alert("Upload error", "Could not upload/extract PDF text.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Navigate to Player
  const openPlayer = (item: PdfItem) => {
    router.push({
      pathname: "/player",
      params: { id: item.id, uri: item.uri, name: item.name },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My PDFs</Text>

      <UploadButton onPick={onPick} />

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <FlatList
        data={items.slice(0, 20)}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PdfCard item={item} onPress={() => openPlayer(item)} />
        )}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No PDFs yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  listContent: {
    paddingTop: 12,
    paddingBottom: 60,
    paddingHorizontal: 8,
  },
  emptyText: { marginTop: 20, color: "#666" },
});

