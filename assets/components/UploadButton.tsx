// import { StyleSheet, Text, TouchableOpacity } from "react-native";


// type Props = {
//     title?: string;
//     onPress: () => void;
// };

// export default function UploadButton({title = 'Pick a pdf', onPress}: Props) {

//     return(
//         <TouchableOpacity style={styles.button} onPress={onPress}>
//             <Text style={styles.text}>{title}</Text>
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     button: {
//         backgroundColor: '#ff6f00',
//         paddingVertical: 12,
//         paddingHorizontal: 20,
//         borderRadius: 8,
//     },
//     text: {
//         color: 'white',
//         fontWeight: '600',
//         textAlign: 'center'
//     },
// });

// components/UploadButton.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";

type Props = {
  title?: string;
  onPick: (asset: { uri: string; name?: string; size?: number } | null) => void;
};

export default function UploadButton({ title = "Pick PDF", onPick }: Props) {
  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      // handle both old and new shapes of the response
      let asset: any = null;
      if ((res as any).canceled !== undefined) {
        // new API: { canceled, assets: [...] }
        const r: any = res;
        if (!r.canceled && r.assets && r.assets.length > 0) asset = r.assets[0];
      } else {
        // legacy: { type: "success" | "cancel", uri, name, size }
        const r: any = res;
        if (r.type === "success") asset = { uri: r.uri, name: r.name, size: r.size };
      }

      onPick(asset);
    } catch (err) {
      console.warn("Document pick failed", err);
      onPick(null);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={pick}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ff6f00",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
  },
  text: { color: "#fff", fontWeight: "600" },
});
