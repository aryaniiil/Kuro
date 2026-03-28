import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { fetchGenre } from "../src/api";

export default function GenreScreen() {
    const router = useRouter();
    const { name } = useLocalSearchParams();

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);

    const loadData = async (pageNum: number, isRefresh: boolean) => {
        if (!name) return;
        if (isRefresh) setLoading(true);
        else setFetchingMore(true);

        const data = await fetchGenre(name as string, pageNum);

        if (data) {
            setResults(prev => isRefresh ? (data.animes || []) : [...prev, ...(data.animes || [])]);
            setHasNextPage(data.hasNextPage);
            setPage(pageNum);
        } else if (isRefresh) {
            setResults([]);
            setHasNextPage(false);
        }

        setLoading(false);
        setFetchingMore(false);
    };

    useEffect(() => {
        loadData(1, true);
    }, [name]);

    const loadMore = () => {
        if (!fetchingMore && hasNextPage && !loading) {
            loadData(page + 1, false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="w-[48%] mb-6"
            onPress={() => router.push(`/details?id=${item.id}`)}
        >
            <View className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-800 mb-2 relative border border-zinc-800">
                {item.episodes?.sub && (
                    <View className="absolute bottom-2 right-2 bg-zinc-950/80 px-1.5 py-0.5 rounded shadow z-10">
                        <Text className="text-zinc-300 text-[10px] font-bold">Ep {item.episodes.sub}</Text>
                    </View>
                )}
                {item.rating && (
                    <View className="absolute top-2 left-2 bg-zinc-200 px-1.5 py-0.5 rounded shadow z-10">
                        <Text className="text-zinc-900 text-[10px] font-bold">{item.rating}</Text>
                    </View>
                )}
                <Image source={{ uri: item.poster }} className="w-full h-full object-cover absolute inset-0" />
            </View>
            <Text className="text-white font-semibold text-sm w-full leading-tight mb-1" numberOfLines={1}>{item.name}</Text>
            {item.type && (
                <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">{item.type}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="w-full px-4 pt-14 pb-4 bg-[#09090b] relative flex-row items-center border-b border-zinc-900 z-20">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center bg-zinc-900 border border-zinc-800 z-10">
                    <ArrowLeft size={20} color="#a1a1aa" />
                </TouchableOpacity>
                <View className="absolute inset-0 pt-14 pb-4 items-center justify-center -z-10">
                    <Text className="text-lg font-bold text-white tracking-tight capitalize">{name}</Text>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#fafafa" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, idx) => `${item.id}-${idx}`}
                    numColumns={2}
                    renderItem={renderItem}
                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => (
                        fetchingMore ? (
                            <View className="py-6 items-center flex-row justify-center gap-3">
                                <ActivityIndicator size="small" color="#fafafa" />
                                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Loading more...</Text>
                            </View>
                        ) : !hasNextPage && results.length > 0 ? (
                            <View className="py-8 items-center">
                                <Text className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">End of results</Text>
                            </View>
                        ) : null
                    )}
                    ListEmptyComponent={() => (
                        !loading && (
                            <View className="py-10 items-center">
                                <Text className="text-zinc-500 text-base font-semibold">No anime found for {name}.</Text>
                            </View>
                        )
                    )}
                />
            )}
        </View>
    );
}
