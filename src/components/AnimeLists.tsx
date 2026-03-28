import { View, Text, ScrollView, ImageBackground, TouchableOpacity } from "react-native";
import { ChevronRight, Play } from "lucide-react-native";
import { useRouter } from "expo-router";

export function ContinueWatchingList({ data }: { data: any[] }) {
    const router = useRouter();

    if (!data || data.length === 0) return null;

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View className="mt-2 pl-4">
            <View className="flex-row items-center justify-between pr-4 mb-4">
                <Text className="text-lg font-bold text-white tracking-tight">Continue Watching</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4 pb-2">
                {data.map((item, idx) => {
                    const progressPercentage = (item.duration && item.duration > 0 && item.currentTime !== undefined && !isNaN(item.currentTime))
                        ? Math.min(100, Math.max(0, (item.currentTime / item.duration) * 100))
                        : 0;
                    return (
                        <TouchableOpacity key={idx} className="w-64 mr-4 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800/80" onPress={() => router.push({ pathname: '/player', params: { id: item.id, epId: item.currentEpId } })}>
                            <View className="relative aspect-video w-full bg-zinc-800">
                                <ImageBackground source={{ uri: item.poster }} className="w-full h-full absolute inset-0 bg-cover bg-center" />
                                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                    <View className="w-10 h-10 rounded-full bg-black/60 items-center justify-center pl-1 border border-zinc-700">
                                        <Play size={20} color="#fff" fill="#fff" />
                                    </View>
                                </View>
                                <View className="absolute bottom-0 w-full h-1 bg-zinc-900 flex-row">
                                    <View style={{ width: `${progressPercentage || 0}%`, height: '100%', backgroundColor: 'white' }} />
                                </View>
                            </View>
                            <View className="p-3">
                                <Text className="text-sm font-bold text-zinc-100 mb-1" numberOfLines={1}>{item.name}</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-xs text-zinc-400 font-medium">Episode {item.currentEpNumber}</Text>
                                    <Text className="text-[10px] text-zinc-500 font-medium">
                                        {formatTime(item.currentTime)} / {formatTime(item.duration)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export function LatestEpisodesList({ data }: { data: any[] }) {
    const router = useRouter();

    if (!data || data.length === 0) return null;

    return (
        <View className="mt-2 pl-4">
            <View className="flex-row items-center justify-between pr-4 mb-4">
                <Text className="text-lg font-bold text-white tracking-tight">Latest Episodes</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4 pb-2">
                {data.map((item, idx) => (
                    <TouchableOpacity key={idx} className="w-64 mr-4" onPress={() => router.push(`/details?id=${item.id}`)}>
                        <View className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 mb-2">
                            <ImageBackground source={{ uri: item.poster }} className="w-full h-full absolute inset-0 bg-cover bg-center" />
                        </View>
                        <Text className="text-sm font-semibold text-zinc-100 mt-1" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-xs text-zinc-500 mt-0.5">Ep {item.episodes?.sub || 0} Sub / {item.episodes?.dub || 0} Dub</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

export function TrendingNowList({ data }: { data: any[] }) {
    const router = useRouter();

    if (!data || data.length === 0) return null;

    return (
        <View className="mt-6 pl-4">
            <View className="flex-row items-center justify-between pr-4 mb-4">
                <Text className="text-lg font-bold text-white tracking-tight">Trending Now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4">
                {data.map((item, idx) => (
                    <TouchableOpacity key={idx} className="w-32 mr-3" onPress={() => router.push(`/details?id=${item.id}`)}>
                        <View className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 mb-2 relative">
                            {!!item.rank && (
                                <View className={`absolute top-2 left-2 px-1.5 py-0.5 rounded shadow-sm z-10 ${item.rank === 1 ? 'bg-white border-white' : 'bg-zinc-800/80 border border-zinc-700'}`}>
                                    <Text className={`${item.rank === 1 ? 'text-black' : 'text-white'} text-[10px] font-bold`}>#{item.rank}</Text>
                                </View>
                            )}
                            <ImageBackground source={{ uri: item.poster }} className="w-full h-full absolute inset-0 bg-cover bg-center" />
                        </View>
                        <Text className="text-sm font-medium text-zinc-200 mt-1" numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

export function RecentlyAddedList({ data }: { data: any[] }) {
    const router = useRouter();

    if (!data || data.length === 0) return null;

    return (
        <View className="mt-6 pl-4 mb-32">
            <View className="flex-row items-center justify-between pr-4 mb-4">
                <Text className="text-lg font-bold text-white tracking-tight">Today Top 10</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4">
                {data.map((item, idx) => (
                    <TouchableOpacity key={idx} className="w-28 mr-3" onPress={() => router.push(`/details?id=${item.id}`)}>
                        <View className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 mb-2 relative">
                            <View className="absolute top-2 right-2 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 shadow-sm z-10">
                                <Text className="text-white text-[8px] font-bold uppercase tracking-wider">Top {item.rank}</Text>
                            </View>
                            <ImageBackground source={{ uri: item.poster }} className="w-full h-full absolute inset-0 bg-cover bg-center opacity-90" />
                        </View>
                        <Text className="text-xs font-medium text-zinc-300 mt-1" numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
