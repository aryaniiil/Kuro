import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Clock, RefreshCw, ChevronLeft, ChevronRight, Calendar, Video, Image as ImageIcon, BookmarkPlus, BookmarkMinus } from "lucide-react-native";
import BottomNav from "../src/components/BottomNav";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { fetchSchedule, fetchAnimeInfo } from "../src/api";
import { storage } from "../src/hooks/useStorage";
import { LinearGradient } from "expo-linear-gradient";

const ScheduledAnimeCard = ({ item, isToday, router }: { item: any; isToday: boolean; router: any }) => {
    const [poster, setPoster] = useState<string | null>(item.poster || null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        storage.isAnimeSaved(item.id).then(setIsSaved);

        if (!item.poster && item.id) {
            fetchAnimeInfo(item.id).then(data => {
                if (data?.anime?.info?.poster) {
                    setPoster(data.anime.info.poster);
                }
            });
        }
    }, [item.id, item.poster]);

    const toggleSave = async () => {
        if (isSaved) {
            await storage.removeAnime(item.id);
            setIsSaved(false);
        } else {
            // Need a poster to save properly
            await storage.saveAnime({
                id: item.id,
                name: item.name,
                poster: poster || "",
            });
            setIsSaved(true);
        }
    };

    let localTimeStr = item.time;
    if (item.airingTimestamp) {
        const d = new Date(item.airingTimestamp);
        localTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <TouchableOpacity
            onPress={() => router.push(`/details?id=${item.id}`)}
            className="mb-4 rounded-xl border border-zinc-800/60 overflow-hidden relative shadow-sm min-h-[120px]"
        >
            <View className="absolute inset-0 bg-zinc-900">
                {poster ? (
                    <>
                        <ImageBackground
                            source={{ uri: poster }}
                            className="w-full h-full bg-cover bg-center opacity-40"
                        />
                        <LinearGradient colors={['rgba(9,9,11,0.5)', 'rgba(9,9,11,0.8)', '#09090b']} className="absolute inset-0" />
                    </>
                ) : (
                    <View className="absolute inset-0 items-center justify-center opacity-30 mt-2 pl-20">
                        <ImageIcon size={24} color="#a1a1aa" />
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Image Coming Soon</Text>
                    </View>
                )}
            </View>

            <View className="p-4 flex-row gap-4 flex-1 h-full items-center z-10 w-full">
                {/* Time Box */}
                <View className="flex-col h-full min-w-[70px] items-center justify-center pr-4 border-r border-zinc-800">
                    <View className="bg-zinc-200 px-2 py-1.5 rounded w-full items-center mb-1 shadow-sm">
                        <Text className="text-zinc-950 text-sm font-black tracking-wider">{localTimeStr}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-1">
                        <Clock size={10} color="#71717a" />
                        <Text className="text-[10px] text-zinc-500 font-bold uppercase">Local</Text>
                    </View>
                </View>

                {/* Details */}
                <View className="flex-[0.85] justify-center py-1 pr-2">
                    <Text className="text-base font-bold text-zinc-100 leading-tight mb-2" numberOfLines={2}>{item.name}</Text>
                    <View className="flex-row items-center flex-wrap gap-2">
                        <View className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                            <Text className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Ep {item.episode || '?'}</Text>
                        </View>
                        {item.secondsUntilAiring !== undefined && item.secondsUntilAiring > 0 && isToday ? (
                            <View className="flex-row items-center gap-1">
                                <Video size={12} color="#a1a1aa" />
                                <Text className="text-xs text-zinc-400 font-medium">In {Math.floor(item.secondsUntilAiring / 3600)}h {Math.floor((item.secondsUntilAiring % 3600) / 60)}m</Text>
                            </View>
                        ) : item.secondsUntilAiring !== undefined && item.secondsUntilAiring <= 0 && isToday ? (
                            <View className="flex-row items-center gap-1">
                                <Video size={12} color="#fafafa" />
                                <Text className="text-xs text-zinc-200 font-bold">Aired</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Save Quick Action */}
                <View className="flex-[0.15] items-center justify-center">
                    <TouchableOpacity
                        onPress={toggleSave}
                        className={`p-2 rounded-full border ${isSaved ? 'bg-zinc-200 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}
                    >
                        {isSaved ? <BookmarkMinus size={16} color="#09090b" /> : <BookmarkPlus size={16} color="#fafafa" />}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function ScheduledScreen() {
    const router = useRouter();
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Default to today
    const [currentDate, setCurrentDate] = useState(new Date());

    const loadData = async (dateObj: Date) => {
        setLoading(true);
        setError(false);
        try {
            const formattedDate = dateObj.toISOString().split('T')[0];
            const data = await fetchSchedule(formattedDate);
            if (data?.scheduledAnimes) {
                setScheduleData(data.scheduledAnimes);
            } else {
                setScheduleData([]);
            }
        } catch (e) {
            console.error("Scheduled loadData error:", e);
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData(currentDate);
    }, [currentDate]);

    const changeWeek = (weeks: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + (weeks * 7));
        setCurrentDate(nextDate);
    };

    const getWeekDates = () => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));

        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();
    const currentDayStr = new Date().toISOString().split('T')[0];

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Header Area */}
            <View className="w-full pt-16 pb-4 bg-[#09090b] z-20 border-b border-zinc-900 border-solid flex-col">
                <View className="flex-row items-center justify-between px-6 mb-6">
                    <View className="flex-row items-center gap-3">
                        <Calendar size={24} color="#fafafa" />
                        <Text className="text-2xl font-bold text-white tracking-tight">Scheduled</Text>
                    </View>
                    <View className="flex-row items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                        <TouchableOpacity onPress={() => changeWeek(-1)} className="p-2">
                            <ChevronLeft size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                        <Text className="text-zinc-200 text-xs font-semibold px-2">Week</Text>
                        <TouchableOpacity onPress={() => changeWeek(1)} className="p-2">
                            <ChevronRight size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Week Options */}
                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="px-5"
                        contentContainerStyle={{ gap: 12, paddingRight: 40 }}
                    >
                        {weekDates.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = dateStr === currentDate.toISOString().split('T')[0];
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = date.getDate();
                            return (
                                <TouchableOpacity
                                    key={`${dateStr}-${isSelected}`}
                                    onPress={() => setCurrentDate(date)}
                                    className={`items-center justify-center p-2 rounded-xl border ${isSelected ? 'bg-zinc-200 border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'} 
                                        w-14 h-16`}
                                >
                                    <Text className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>{dayName}</Text>
                                    <Text className={`text-lg font-extrabold ${isSelected ? 'text-zinc-950' : 'text-zinc-200'}`}>{dayNum}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* Scrollable Content */}
            <View className="flex-1">
                {loading ? (
                    <View key="loading" className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#fafafa" />
                        <Text className="text-zinc-500 text-sm mt-4">Loading schedule...</Text>
                    </View>
                ) : error ? (
                    <View key="error" className="flex-1 items-center justify-center px-8">
                        <Text className="text-white text-lg font-bold mb-2">Failed to load</Text>
                        <Text className="text-zinc-500 text-sm text-center mb-6">Could not load the schedule for this day. Try another day.</Text>
                        <TouchableOpacity onPress={() => loadData(currentDate)} className="flex-row items-center gap-2 bg-zinc-200 px-6 py-3 rounded-xl">
                            <RefreshCw size={18} color="#09090b" />
                            <Text className="text-zinc-950 font-semibold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : scheduleData.length === 0 ? (
                    <View key="empty" className="flex-1 items-center justify-center px-8">
                        <Clock size={48} color="#27272a" />
                        <Text className="text-zinc-400 text-base font-semibold mt-4">No anime scheduled</Text>
                        <Text className="text-zinc-600 text-sm mt-1 text-center">There are no episodes scheduled to air or release on this date.</Text>
                    </View>
                ) : (
                    <View key="content" className="flex-1">
                        <ScrollView
                            className="flex-1 px-5 pt-4"
                            contentContainerStyle={{ paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {scheduleData.map((item, idx) => {
                                const isToday = currentDate.toISOString().split('T')[0] === currentDayStr;
                                return (
                                    <ScheduledAnimeCard
                                        key={`${item.id}-${idx}`}
                                        item={item}
                                        isToday={isToday}
                                        router={router}
                                    />
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full z-30">
                <BottomNav />
            </View>
        </View>
    );
}
