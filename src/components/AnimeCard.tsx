import { View, Text, Image, TouchableOpacity } from "react-native";

interface AnimeCardProps {
    title: string;
    imageUrl: string;
    episode?: string;
}

export default function AnimeCard({ title, imageUrl, episode }: AnimeCardProps) {
    return (
        <TouchableOpacity className="w-32 mr-4 flex-col gap-2">
            <View className="w-full aspect-[3/4] rounded-lg overflow-hidden relative border border-zinc-800 bg-card">
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-full object-cover"
                />
                {episode && (
                    <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded">
                        <Text className="text-xs text-primary font-medium">{episode}</Text>
                    </View>
                )}
            </View>
            <Text className="text-sm text-primary font-semibold" numberOfLines={1}>{title}</Text>
        </TouchableOpacity>
    );
}
