import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export type PdfItem = {
  id: string;
  name: string;
  uri: string;
  createdAt: string; // ISO string
  coverUri?: string | null;
};

type Props = {
  item: PdfItem;
  onPress: () => void;
};

export default function PdfCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.cover} />
      ) : (
        <View style={styles.placeholder}>
          <Text numberOfLines={2} style={styles.filename}>
            {item.name}
          </Text>
        </View>
      )}
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cover: {
    width: 72,
    height: 96,
    borderRadius: 4,
    marginRight: 12,
    resizeMode: "cover",
  },
  placeholder: {
    width: 72,
    height: 96,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  filename: { fontSize: 12, textAlign: "center" },
  meta: { flex: 1 },
  name: { fontWeight: "600" },
  date: { color: "#666", marginTop: 6, fontSize: 12 },
});
