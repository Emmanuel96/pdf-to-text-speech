import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

type Props = {
  timestamp: string;
  snippet: string;
  onPress?: () => void;
};

export default function BookMarkCard({ timestamp, snippet, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        <Text style={styles.snippet}>{snippet}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  snippet: {
    fontSize: 14,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
});
