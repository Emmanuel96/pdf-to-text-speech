import { Dimensions, StyleSheet, View, Text, TouchableOpacity } from "react-native";

const screenWidth = Dimensions.get("window").width;

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
      <View style={styles.thumbnail} />
      <Text style={styles.title} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: screenWidth / 2 - 24,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: 180, 
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#ddd",
  },
  title: {
    fontSize: 16, 
    fontWeight: "600",
    textAlign: "center",
  },
});
