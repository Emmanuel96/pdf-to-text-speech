import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet } from "react-native";
import UploadButton from "@/assets/components/UploadButton";
import PdfCard, { PdfItem } from "@/assets/components/PdfCard";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const STORAGE_KEY = "@pdfs";

export default function HomeScreen() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        // sort newest first
        arr.sort((a: PdfItem, b: PdfItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(arr);
      } catch (err) {
        console.warn("Failed to load saved pdfs", err);
      }
    })();
  }, []);

  const persistItems = async (next: PdfItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
    } catch (err) {
      console.warn("Failed to persist pdfs", err);
    }
  };

  const onPick = async (asset: any) => {
    if (!asset || !asset.uri) return;

    setLoading(true);
    try {
      const dir = `${FileSystem.documentDirectory}pdfs`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const safeName = (asset.name || "document.pdf").replace(/\s+/g, "_");
      const dest = `${dir}/${Date.now()}-${safeName}`;

      // Try copy, if fails, try download as fallback
      try {
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
      } catch (copyErr) {
        // fallback: try read and write as base64 (slower but works in some content-uri cases)
        try {
          const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType?.UTF8 || ("utf8" as any) }).catch(() => null);
          if (b64) {
            await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType?.UTF8 || ("utf8" as any) });
          } else {
            // As last fallback, attempt downloadAsync (works for http(s) URIs)
            await FileSystem.downloadAsync(asset.uri, dest);
          }
        } catch (fallbackErr) {
          console.warn("Copy fallback failed", fallbackErr);
          // still try to use original uri if nothing else works
        }
      }

      const item: PdfItem = {
        id: Date.now().toString(),
        name: asset.name ?? dest.split("/").pop() ?? "document.pdf",
        uri: dest, // destination inside app sandbox (if copy worked) else still the original uri
        createdAt: new Date().toISOString(),
        coverUri: null,
      };

      const next = [item, ...items].slice(0, 20);
      await persistItems(next);
    } catch (err) {
      console.warn("Failed to save picked PDF", err);
      Alert.alert("Save error", "Could not save the selected PDF on device.");
    } finally {
      setLoading(false);
    }
  };

  const openPlayer = (item: PdfItem) => {
    // navigate to player with id param
    router.push({ pathname: "/player", params: { id: item.id } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My PDFs</Text>

      <UploadButton onPick={onPick} />

      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}

      <FlatList
        data={items.slice(0, 20)}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <PdfCard item={item} onPress={() => openPlayer(item)} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 60 }}
        ListEmptyComponent={<Text style={{ marginTop: 20, color: "#666" }}>No PDFs yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
});

