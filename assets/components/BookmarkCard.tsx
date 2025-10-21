import { StyleSheet, Text, View, TouchableOpacity, Button, Alert, FlatList } from "react-native";

type Props = {
  timestamp: string;
  snippet: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onShare?: () => void;
  onTalk?: () => void;
  notes?: string[];
};

export default function BookMarkCard({ timestamp, snippet, onPress, onLongPress, onShare, onTalk, notes = [] }: Props) {

  const handleLongPress = () => {
    if (onLongPress) {
      Alert.alert(
        "Delete Bookmark",
        "Are you sure you want to delete this bookmark?",
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Delete', style: 'destructive', onPress: onLongPress},
        ]
      );
    }
  }
  return (
    <TouchableOpacity onPress={onPress} onLongPress={handleLongPress} activeOpacity={0.7}>
      <View style={styles.card}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        <Text style={styles.snippet} numberOfLines={3} ellipsizeMode="tail">{snippet}</Text>
        {onShare && (
          <TouchableOpacity style={styles.button} onPress={onShare}>
            <Text style={styles.share}>Share</Text>
          </TouchableOpacity>
        )}
        {notes.length > 0 && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesHeader}>Notes:</Text>
            <FlatList
            data={notes}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({item}) => <Text style={styles.noteItem}>. {item}</Text>}
            />
          </View>
        )}
        {onTalk && (
          <TouchableOpacity style={styles.button} onPress={onTalk}>
            <Text style={styles.share}>Talk</Text>
          </TouchableOpacity>
        )}
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 4,
    
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
  button: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    borderRadius: 6,
  },
  share: {
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600'
  },
   notesContainer: {
    marginTop: 10,
    backgroundColor: "#E9F0FA",
    borderRadius: 6,
    padding: 8,
  },
  notesHeader: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  noteItem: {
    fontSize: 13,
    color: "#444",
  },
});
