import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Heart, Play, Star } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { fetchAnimeInfo, fetchAnimeEpisodes } from "../src/api";
import { storage } from "../src/hooks/useStorage";

export default function DetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [info, setInfo] = useState<any>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("details"); // 'episodes' or 'details'
    const [isSaved, setIsSaved] = useState(false);

    // Pagination for Episode List
    const [selectedChunk, setSelectedChunk] = useState(0);
    const EPISODES_PER_CHUNK = 100;

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            setLoading(true);
            const savedStatus = await storage.isAnimeSaved(id as string);
            setIsSaved(savedStatus);
            const animeData = await fetchAnimeInfo(id as string);
            if (animeData?.anime?.info) {
                setInfo({ ...animeData.anime.info, moreInfo: animeData.anime.moreInfo });
            }

            const epsData = await fetchAnimeEpisodes(id as string);
            if (epsData?.episodes) {
                setEpisodes(epsData.episodes);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 bg-[#09090b] items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    if (!info) {
        return (
            <View className="flex-1 bg-[#09090b] items-center justify-center p-6">
                <Text className="text-white text-lg font-bold mb-4">Failed to load anime info.</Text>
                <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 bg-white rounded-lg">
                    <Text className="text-black font-semibold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Top action bar overlay */}
            <View className="absolute top-0 left-0 right-0 z-20 px-4 pt-14 pb-2 flex-row items-center justify-between">
                <LinearGradient
                    colors={['rgba(9, 9, 11, 0.9)', 'transparent']}
                    className="absolute inset-0 top-0 bottom-[-40px]"
                />
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center bg-zinc-950/40 border border-zinc-800"
                >
                    <ArrowLeft size={24} color="#fafafa" />
                </TouchableOpacity>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={async () => {
                            if (!info) return;
                            if (isSaved) {
                                await storage.removeAnime(id as string);
                                setIsSaved(false);
                            } else {
                                await storage.saveAnime({
                                    id: id as string,
                                    name: info.name,
                                    poster: info.poster
                                });
                                setIsSaved(true);
                            }
                        }}
                        className={`w-10 h-10 rounded-full items-center justify-center border ${isSaved ? 'bg-zinc-200 border-zinc-200' : 'bg-zinc-950/40 border-zinc-800'}`}
                    >
                        <Heart size={20} color={isSaved ? "#09090b" : "#fafafa"} fill={isSaved ? "#09090b" : "transparent"} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header Hero Area */}
                <View className="relative w-full h-[480px]">
                    <ImageBackground
                        source={{ uri: info.poster }}
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                    />
                    <LinearGradient colors={['rgba(9, 9, 11, 0.2)', 'transparent', '#09090b']} className="absolute inset-0" />
                    <LinearGradient colors={['transparent', 'rgba(9, 9, 11, 0.6)', '#09090b']} className="absolute inset-0 top-[25%]" />

                    <View className="absolute bottom-0 w-full px-5 pb-6 flex-col items-center text-center">
                        <View className="mb-4 flex-row gap-2 justify-center">
                            {info.stats?.quality && (
                                <View className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                                    <Text className="text-[10px] font-bold text-white uppercase tracking-wider">{info.stats.quality}</Text>
                                </View>
                            )}
                            {info.stats?.type && (
                                <View className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">
                                    <Text className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{info.stats.type}</Text>
                                </View>
                            )}
                        </View>

                        <Text className="text-3xl font-extrabold text-white leading-tight tracking-tight text-center shadow-xl mb-3">
                            {info.name}
                        </Text>

                        <View className="flex-row items-center gap-4 mb-6">
                            {!!info.stats?.rating && (
                                <>
                                    <View className="flex-row items-center gap-1">
                                        <Text className="text-white text-sm font-medium border border-zinc-500 px-1 rounded text-xs">{info.stats.rating}</Text>
                                    </View>
                                    <View className="w-1 h-1 rounded-full bg-zinc-600" />
                                </>
                            )}
                            <Text className="text-zinc-300 text-sm font-medium">{info.moreInfo?.aired?.split(' ')[2] || "N/A"}</Text>
                            <View className="w-1 h-1 rounded-full bg-zinc-600" />
                            <Text className="text-zinc-300 text-sm font-medium">{info.stats?.episodes?.sub || 0} Episodes</Text>
                            <View className="w-1 h-1 rounded-full bg-zinc-600" />
                            <Text className="text-zinc-300 text-sm font-medium">{info.stats?.duration || 'Unknown'}</Text>
                        </View>

                        <View className="flex-row w-full gap-3">
                            <TouchableOpacity onPress={() => router.push({ pathname: '/player', params: { id: id as string, epId: episodes[0]?.episodeId || '' } })} className="flex-1 bg-white h-12 rounded-xl flex-row items-center justify-center gap-2 shadow-lg">
                                <Play size={20} color="#09090b" fill="#09090b" />
                                <Text className="text-zinc-950 font-bold text-sm">Play S1 E1</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Sticky-like Tab Bar */}
                <View className="px-5 mt-2 mb-6 py-2">
                    <View className="flex-row p-1 bg-zinc-900 rounded-xl">
                        <TouchableOpacity key={`tab-eps-${activeTab === 'episodes'}`} onPress={() => setActiveTab('episodes')} className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'episodes' ? 'bg-white shadow-sm' : ''}`}>
                            <Text key={`txt-eps-${activeTab === 'episodes'}`} className={`text-sm ${activeTab === 'episodes' ? 'font-bold text-zinc-950' : 'font-medium text-zinc-400'}`}>Episodes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity key={`tab-det-${activeTab === 'details'}`} onPress={() => setActiveTab('details')} className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'details' ? 'bg-white shadow-sm' : ''}`}>
                            <Text key={`txt-det-${activeTab === 'details'}`} className={`text-sm ${activeTab === 'details' ? 'font-bold text-zinc-950' : 'font-medium text-zinc-400'}`}>Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Sections */}
                {activeTab === 'details' ? (
                    <View key="tab-details" className="px-5 pb-20">
                        <View className="mb-8">
                            <Text className="text-white font-bold text-lg mb-2">Synopsis</Text>
                            <Text className="text-zinc-400 text-sm leading-relaxed">
                                {info.description}
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap mb-8">
                            <View className="w-1/2 mb-4 pr-4">
                                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Studio</Text>
                                <Text className="text-white text-sm font-medium">{info.moreInfo?.studios || 'Unknown'}</Text>
                            </View>
                            <View className="w-1/2 mb-4 pl-4">
                                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Director</Text>
                                <Text className="text-white text-sm font-medium">Unknown</Text>
                            </View>
                            <View className="w-1/2 mb-4 pr-4">
                                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Genre</Text>
                                <Text className="text-white text-sm font-medium">{info.moreInfo?.genres?.join(', ') || 'Various'}</Text>
                            </View>
                            <View className="w-1/2 mb-4 pl-4">
                                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</Text>
                                <Text className="text-white text-sm font-medium">{info.moreInfo?.status || 'Unknown'}</Text>
                            </View>
                        </View>

                        {info.characterVoiceActor && info.characterVoiceActor.length > 0 && (
                            <View>
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-white font-bold text-lg">Cast</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 pb-2">
                                    {info.characterVoiceActor.map((actor: any, idx: number) => (
                                        <View key={idx} className="items-center gap-2 mr-4 w-18">
                                            <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-800">
                                                <Image source={{ uri: actor.character.poster }} className="w-full h-full object-cover" />
                                            </View>
                                            <View className="items-center">
                                                <Text className="text-xs font-medium text-white text-center w-20" numberOfLines={1}>{actor.character.name}</Text>
                                                <Text className="text-[10px] text-zinc-500 text-center w-20" numberOfLines={1}>{actor.character.cast}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : (
                    <View key="tab-episodes" className="px-5 pb-20">

                        {/* Chunk Selection Tabs */}
                        {episodes.length > EPISODES_PER_CHUNK && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ flexDirection: 'row' }}>
                                {Array.from({ length: Math.ceil(episodes.length / EPISODES_PER_CHUNK) }).map((_, i) => (
                                    <TouchableOpacity
                                        key={`chunk-${i}-${selectedChunk === i}`}
                                        onPress={() => setSelectedChunk(i)}
                                        className={`mr-3 px-4 py-2 rounded-lg border ${selectedChunk === i ? 'bg-white border-white' : 'bg-zinc-800/80 border-zinc-700/50'}`}
                                    >
                                        <Text key={`chunk-txt-${i}-${selectedChunk === i}`} className={`text-xs font-bold tracking-wider ${selectedChunk === i ? 'text-black' : 'text-zinc-400'}`}>
                                            {i * EPISODES_PER_CHUNK + 1}-{Math.min((i + 1) * EPISODES_PER_CHUNK, episodes.length)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {episodes.slice(selectedChunk * EPISODES_PER_CHUNK, (selectedChunk + 1) * EPISODES_PER_CHUNK).map((ep, idx) => (
                            <TouchableOpacity
                                key={`details-ep-${ep.episodeId || idx}-${idx}`}
                                onPress={() => router.push({ pathname: '/player', params: { id: id as string, epId: ep.episodeId } })}
                                className="flex-row items-center justify-between py-4 border-b border-zinc-800/60"
                            >
                                <View className="flex-1 pr-4">
                                    <Text className="text-white text-base font-semibold mb-1" numberOfLines={1}>
                                        {ep.number}. {ep.title}
                                    </Text>
                                    <Text className="text-zinc-500 text-xs">
                                        {ep.isFiller ? 'Filler Episode' : 'Canon'}
                                    </Text>
                                </View>
                                <View className="w-8 h-8 rounded-full border border-zinc-700 items-center justify-center bg-zinc-900 pl-0.5">
                                    <Play size={14} color="#a1a1aa" fill="#a1a1aa" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View >
    );
}
