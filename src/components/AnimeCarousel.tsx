import { View, Text, FlatList } from "react-native";
import AnimeCard from "./AnimeCard";

interface AnimeItem {
    id: string;
    title: string;
    imageUrl: string;
    episode?: string;
}

interface AnimeCarouselProps {
    title: string;
    data: AnimeItem[];
}

export default function AnimeCarousel({ title, data }: AnimeCarouselProps) {
    return (
        <View className="mt-8">
            <View className="flex-row justify-between items-end px-4 mb-4">
                <Text className="text-xl font-bold text-primary">{title}</Text>
                <Text className="text-zinc-400 font-medium">See All</Text>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AnimeCard
                        title={item.title}
                        imageUrl={item.imageUrl}
                        episode={item.episode}
                    />
                )}
            />
        </View>
    );
}
