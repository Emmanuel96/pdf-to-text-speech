import BookMarkCard from "@/assets/components/BookmarkCard";
import { ScrollView } from "react-native";


export default function BookMark() {
    //populated with dummy data first
    const bookmarks = [
        {timestamp: "00:01:30", snippet: 'This is the first saved snippet'},
        {timestamp: "00:05:45", snippet: 'Another important passage'}
    ];

    return (
        <ScrollView style={{flex: 1, padding: 16}} contentContainerStyle={{paddingBottom: 40}}>
            {bookmarks.map((bm, i) => (
                <BookMarkCard
                key={i}
                timestamp={bm.timestamp}
                snippet={bm.snippet}
                />
            ))}
        </ScrollView>
    )
}