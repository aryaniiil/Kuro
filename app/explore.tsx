import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { RefreshCw, LayoutGrid } from "lucide-react-native";
import BottomNav from "../src/components/BottomNav";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { fetchHome } from "../src/api";

const ExploreSection = ({ title, data }: { title: string, data: any[] }) => {
    const router = useRouter();
    if (!data || data.length === 0) return null;

    return (
        <View className="mb-8">
            <Text className="text-xl font-bold text-white tracking-tight mb-4 px-6">{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 pr-6">
                {data.map((item, idx) => (
                    <TouchableOpacity key={`${item.id}-${idx}`} className="w-36 mr-4" onPress={() => router.push(`/details?id=${item.id}`)}>
                        <View className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 mb-2 relative">
                            {!!item.rank && (
                                <View className="absolute top-2 left-2 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 shadow-sm z-10">
                                    <Text className="text-white text-[10px] font-bold">#{item.rank}</Text>
                                </View>
                            )}
                            {!!item.episodes?.sub && (
                                <View className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded z-10">
                                    <Text className="text-zinc-300 text-[10px] font-bold">Ep {item.episodes.sub}</Text>
                                </View>
                            )}
                            <ImageBackground source={{ uri: item.poster }} className="w-full h-full absolute inset-0 bg-cover bg-center" />
                        </View>
                        <Text className="text-sm font-semibold text-zinc-100" numberOfLines={1}>{item.name}</Text>
                        {!!item.type && (
                            <Text className="text-xs text-zinc-500 mt-0.5 uppercase">{item.type}</Text>
                        )}
                    </TouchableOpacity>
                ))}
                <View className="w-6" />
            </ScrollView>
        </View>
    );
};

export default function ExploreScreen() {
    const router = useRouter();
    const [homeData, setHomeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await fetchHome();
            if (data) {
                setHomeData(data);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error("Explore loadData error:", e);
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="w-full px-6 pt-16 pb-4 bg-[#09090b] z-20 border-b border-zinc-900 flex-row items-center gap-3">
                <LayoutGrid size={24} color="#fafafa" />
                <Text className="text-2xl font-bold text-white tracking-tight">Explore</Text>
            </View>

            {/* Scrollable Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fff" />
                    <Text className="text-zinc-500 text-sm mt-4">Discovering anime...</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-white text-lg font-bold mb-2">Failed to load</Text>
                    <Text className="text-zinc-500 text-sm text-center mb-6">Could not reach the server. Check your internet connection and try again.</Text>
                    <TouchableOpacity onPress={loadData} className="flex-row items-center gap-2 bg-white px-6 py-3 rounded-xl">
                        <RefreshCw size={18} color="#000" />
                        <Text className="text-black font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
                >
                    <ExploreSection title="Spotlight" data={homeData?.spotlightAnimes || []} />
                    <ExploreSection title="Trending" data={homeData?.trendingAnimes || []} />
                    <ExploreSection title="Latest Episodes" data={homeData?.latestEpisodeAnimes || []} />
                    <ExploreSection title="Most Popular" data={homeData?.mostPopularAnimes || []} />
                    <ExploreSection title="Top Upcoming" data={homeData?.topUpcomingAnimes || []} />
                    <ExploreSection title="Top Airing" data={homeData?.topAiringAnimes || []} />
                    <ExploreSection title="Most Favorite" data={homeData?.mostFavoriteAnimes || []} />
                    <ExploreSection title="Latest Completed" data={homeData?.latestCompletedAnimes || []} />

                    {/* Genres */}
                    {homeData?.genres && homeData.genres.length > 0 && (
                        <View className="mb-8 px-6">
                            <Text className="text-xl font-bold text-white tracking-tight mb-4">Genres</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {homeData.genres.map((genre: string, idx: number) => (
                                    <TouchableOpacity key={idx} onPress={() => router.push(`/genre?name=${encodeURIComponent(genre)}`)} className="bg-zinc-800/80 px-4 py-2 rounded-full border border-zinc-700/50">
                                        <Text className="text-zinc-300 font-medium text-sm">{genre}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full z-30">
                <BottomNav />
            </View>
        </View>
    );
}
