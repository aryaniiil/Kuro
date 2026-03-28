import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Play, BookmarkMinus, Clock } from "lucide-react-native";
import BottomNav from "../src/components/BottomNav";
import { storage, SavedAnime, WatchHistoryItem } from "../src/hooks/useStorage";

export default function MyListScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("saved");
    const [savedList, setSavedList] = useState<SavedAnime[]>([]);
    const [historyList, setHistoryList] = useState<WatchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                setIsLoading(true);
                const saved = await storage.getSavedAnimes();
                const history = await storage.getWatchHistory();
                setSavedList(saved);
                setHistoryList(history);
                setIsLoading(false);
            };
            loadData();
        }, [])
    );

    const removeSaved = async (id: string) => {
        await storage.removeAnime(id);
        setSavedList(prev => prev.filter(item => item.id !== id));
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="w-full pt-16 pb-4 bg-[#09090b] z-20 border-b border-zinc-900 border-solid px-6">
                <Text className="text-2xl font-bold text-white tracking-tight">My List</Text>

                {/* Tabs */}
                <View className="flex-row mt-6 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                    <TouchableOpacity
                        onPress={() => setActiveTab('saved')}
                        className="flex-1 py-2 items-center rounded-lg"
                        style={activeTab === 'saved' ? { backgroundColor: '#e4e4e7' } : undefined}
                    >
                        <Text className="text-sm font-semibold tracking-wide" style={{ color: activeTab === 'saved' ? '#09090b' : '#71717a' }}>Saved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('history')}
                        className="flex-1 py-2 items-center rounded-lg"
                        style={activeTab === 'history' ? { backgroundColor: '#e4e4e7' } : undefined}
                    >
                        <Text className="text-sm font-semibold tracking-wide" style={{ color: activeTab === 'history' ? '#09090b' : '#71717a' }}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content List */}
            <View className="flex-1">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#fafafa" />
                    </View>
                ) : activeTab === 'saved' ? (
                    <ScrollView key="history-scroll" className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                        {savedList.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <BookmarkMinus size={48} color="#27272a" />
                                <Text className="text-zinc-400 text-base font-semibold mt-4">No Saved Anime</Text>
                                <Text className="text-zinc-600 text-sm mt-1 text-center">Save anime from the details or scheduled page to see them here.</Text>
                            </View>
                        ) : (
                            savedList.map((item) => (
                                <View key={item.id} className="mb-4 flex-row bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden h-28">
                                    <TouchableOpacity onPress={() => router.push(`/details?id=${item.id}`)} className="w-[80px] h-full relative">
                                        {item.poster ? (
                                            <Image source={{ uri: item.poster }} className="w-full h-full object-cover" />
                                        ) : (
                                            <View className="w-full h-full bg-zinc-800 items-center justify-center">
                                                <Text className="text-zinc-500 text-[10px] font-bold">No Image</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <View className="flex-1 p-3 justify-between">
                                        <TouchableOpacity onPress={() => router.push(`/details?id=${item.id}`)}>
                                            <Text className="text-zinc-100 font-bold text-base leading-tight mb-1" numberOfLines={2}>{item.name}</Text>
                                        </TouchableOpacity>
                                        <View className="flex-row items-center justify-end">
                                            <TouchableOpacity onPress={() => removeSaved(item.id)} className="p-2 -mr-2 -mb-2">
                                                <BookmarkMinus size={20} color="#a1a1aa" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView key="saved-scroll" className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                        {historyList.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <Clock size={48} color="#27272a" />
                                <Text className="text-zinc-400 text-base font-semibold mt-4">Empty History</Text>
                                <Text className="text-zinc-600 text-sm mt-1 text-center">Your watch history will appear here once you watch an episode.</Text>
                            </View>
                        ) : (
                            historyList.map((item) => {
                                const progressPercentage = (item.duration && item.duration > 0 && item.currentTime !== undefined && !isNaN(item.currentTime))
                                    ? Math.min(100, Math.max(0, (item.currentTime / item.duration) * 100))
                                    : 0;
                                return (
                                    <View key={item.id} className="mb-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden">
                                        <View className="flex-row h-28">
                                            <TouchableOpacity onPress={() => router.push(`/details?id=${item.id}`)} className="w-[80px] h-full relative">
                                                {item.poster ? (
                                                    <Image source={{ uri: item.poster }} className="w-full h-full object-cover" />
                                                ) : (
                                                    <View className="w-full h-full bg-zinc-800 items-center justify-center">
                                                        <Text className="text-zinc-500 text-[10px] font-bold">No Image</Text>
                                                    </View>
                                                )}
                                                {/* Compact Progress bar overlay */}
                                                <View className="absolute bottom-0 w-full h-1 bg-zinc-900 flex-row">
                                                    <View style={{ width: `${progressPercentage || 0}%`, height: '100%', backgroundColor: '#e4e4e7' }} />
                                                </View>
                                            </TouchableOpacity>

                                            <View className="flex-1 p-3 justify-between">
                                                <TouchableOpacity onPress={() => router.push(`/details?id=${item.id}`)}>
                                                    <Text className="text-zinc-100 font-bold text-base leading-tight mb-1" numberOfLines={2}>{item.name}</Text>
                                                    <View className="flex-row items-center gap-2 mt-1">
                                                        <View className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                                            <Text className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Ep {item.currentEpNumber}</Text>
                                                        </View>
                                                        <Text className="text-xs text-zinc-500 font-medium">
                                                            {formatTime(item.currentTime)} / {formatTime(item.duration)}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>

                                                <View className="flex-row justify-end mt-2">
                                                    <TouchableOpacity
                                                        onPress={() => router.push({ pathname: '/player', params: { id: item.id, epId: item.currentEpId } })}
                                                        className="flex-row items-center gap-1.5 bg-zinc-200 px-3 py-1.5 rounded-lg"
                                                    >
                                                        <Play size={12} color="#09090b" fill="#09090b" />
                                                        <Text className="text-zinc-950 text-xs font-bold">Resume</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full z-30">
                <BottomNav />
            </View>
        </View>
    );
}
