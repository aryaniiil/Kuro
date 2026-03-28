import { View, Text, ImageBackground, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { Play, Plus, BookmarkMinus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { storage } from "../hooks/useStorage";

const { width } = Dimensions.get("window");

function SpotlightItem({ spotlight }: { spotlight: any }) {
    const router = useRouter();
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (spotlight?.id) {
            storage.isAnimeSaved(spotlight.id).then(setIsSaved);
        }
    }, [spotlight]);

    const toggleSave = async () => {
        if (!spotlight) return;
        if (isSaved) {
            await storage.removeAnime(spotlight.id);
            setIsSaved(false);
        } else {
            await storage.saveAnime({
                id: spotlight.id,
                name: spotlight.name,
                poster: spotlight.poster
            });
            setIsSaved(true);
        }
    };

    if (!spotlight) return <View style={{ width, height: 500 }} className="bg-zinc-900" />;

    return (
        <View style={{ width, height: 500 }} className="relative">
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/details?id=${spotlight.id}`)} className="absolute inset-0 w-full h-full">
                <ImageBackground
                    source={{ uri: spotlight.poster }}
                    className="w-full h-full"
                />
            </TouchableOpacity>
            {/* Overlay Gradient top-down */}
            <LinearGradient
                colors={['rgba(9, 9, 11, 0.3)', 'transparent', '#09090b']}
                className="absolute inset-0"
            />
            {/* Additional bottom gradient for text contrast */}
            <LinearGradient
                colors={['transparent', 'rgba(9, 9, 11, 0.6)', '#09090b']}
                className="absolute inset-0 top-[30%]"
            />

            {/* Hero Content */}
            <View className="absolute bottom-0 w-full px-4 pb-8 flex-col gap-4">
                {/* Badges */}
                <View className="flex-row gap-2 mb-1 flex-wrap">
                    {spotlight.otherInfo?.slice(0, 3).map((info: string, i: number) => (
                        <View key={i} className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
                            <Text className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">{info}</Text>
                        </View>
                    ))}
                </View>

                {/* Title */}
                <Text className="text-4xl font-extrabold text-white leading-tight tracking-tight shadow-lg" numberOfLines={2}>
                    {spotlight.name}
                </Text>

                {/* Description */}
                <Text className="text-zinc-400 text-sm max-w-[90%]" numberOfLines={2}>
                    {spotlight.description?.replace(/<[^>]*>?/gm, '') || "No description available."}
                </Text>

                {/* Actions */}
                <View className="flex-row items-center gap-3 mt-2">
                    <TouchableOpacity onPress={() => router.push(`/details?id=${spotlight.id}`)} className="flex-1 bg-white h-12 rounded-xl flex-row items-center justify-center gap-2 active:bg-zinc-200">
                        <Play size={20} color="#09090b" fill="#09090b" className="-ml-1" />
                        <Text className="text-zinc-950 font-bold text-sm">Watch Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleSave} className={`flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2 border ${isSaved ? 'bg-zinc-200 border-zinc-200 active:bg-zinc-300' : 'bg-zinc-800/80 border-zinc-700 active:bg-zinc-700/80'}`}>
                        {isSaved ? (
                            <>
                                <BookmarkMinus size={20} color="#09090b" className="-ml-1" />
                                <Text className="text-zinc-950 font-bold text-sm">Saved</Text>
                            </>
                        ) : (
                            <>
                                <Plus size={20} color="#ffffff" className="-ml-1" />
                                <Text className="text-white font-medium text-sm">My List</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default function FeaturedPoster({ spotlights }: { spotlights: any[] }) {
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-scroll logic
    useEffect(() => {
        if (!spotlights || spotlights.length === 0) return;

        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % spotlights.length;
                scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
                return nextIndex;
            });
        }, 5000);

        return () => clearInterval(intervalId);
    }, [spotlights]);

    // Handle manual swipes
    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / width);
        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
        }
    };

    if (!spotlights || spotlights.length === 0) return <View className="relative w-full h-[500px] bg-zinc-900" />;

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="w-full h-[500px]"
            onMomentumScrollEnd={handleScroll}
        >
            {spotlights.map((spotlight, index) => (
                <SpotlightItem key={`spotlight-${spotlight.id || index}-${index}`} spotlight={spotlight} />
            ))}
        </ScrollView>
    );
}
