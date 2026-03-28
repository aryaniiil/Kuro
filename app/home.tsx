import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Play, RefreshCw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import FeaturedPoster from "../src/components/FeaturedPoster";
import { ContinueWatchingList, LatestEpisodesList, TrendingNowList, RecentlyAddedList } from "../src/components/AnimeLists";
import BottomNav from "../src/components/BottomNav";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { fetchHome } from "../src/api";
import { storage, WatchHistoryItem } from "../src/hooks/useStorage";

export default function Home() {
    const router = useRouter();
    const [homeData, setHomeData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useFocusEffect(
        useCallback(() => {
            storage.getWatchHistory().then(setHistoryData);
        }, [])
    );

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
            console.error("Home loadData error:", e);
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

            {/* Header / Status Bar Area */}
            <View pointerEvents="none" className="absolute top-0 left-0 right-0 z-20 px-6 pt-12 pb-6 flex-row justify-between items-center bg-transparent">
                <LinearGradient
                    colors={['rgba(9, 9, 11, 1)', 'rgba(9, 9, 11, 0.9)', 'rgba(9, 9, 11, 0.5)', 'transparent']}
                    className="absolute inset-0 top-0 bottom-[-80px]"
                />
                <View className="flex-row items-center gap-2.5">
                    <View className="w-9 h-9 rounded-lg overflow-hidden bg-white items-center justify-center">
                        <Image source={require('../assets/logo.png')} className="w-full h-full" resizeMode="contain" />
                    </View>
                    <Text className="font-bold text-xl text-white tracking-tight">Kuro</Text>
                </View>
            </View>

            {/* Scrollable Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fff" />
                    <Text className="text-zinc-500 text-sm mt-4">Loading anime...</Text>
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
                >
                    {homeData?.spotlightAnimes?.length > 0 && (
                        <View className="w-full">
                            <FeaturedPoster spotlights={homeData.spotlightAnimes.slice(0, 5)} />
                        </View>
                    )}
                    {historyData.length > 0 && <ContinueWatchingList data={historyData} />}
                    <LatestEpisodesList data={homeData?.latestEpisodeAnimes || []} />
                    <TrendingNowList data={homeData?.trendingAnimes || []} />
                    <RecentlyAddedList data={homeData?.top10Animes?.today || []} />
                </ScrollView>
            )}

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full z-30">
                <BottomNav />
            </View>
        </View>
    );
}
