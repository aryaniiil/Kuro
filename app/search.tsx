import { View, Text, ScrollView, TextInput, ImageBackground, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, Play, FlaskConical, Swords, Smile, Bot, Skull, Sparkles, X } from "lucide-react-native";
import BottomNav from "../src/components/BottomNav";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { fetchSearch, fetchHome } from "../src/api";

const GENRES = [
    { name: "Sci-Fi", icon: FlaskConical, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFxECBkuHcc0tmS2SEvIT_G3fCK9o8pvAVYnXzzShORV137ItituD3crxkI48ofhNp4rmw7RMxj67tZb0I7bNbPOAb5wjaOb6odgOm-02TRxBuO37i3JRcUVaSfLxRcqsgHA3-Ypt9-ee_LOrpNSONnWiUpGSd1rmpEcSDSR25PzfgeSpn4H91-pVvdi3uNcN7pXsQkUEOzknMrMx7PnhdK2BG-dbEOErh6p0HxRSXoSBE-gsQ6T2lw3sAiDvwXSSfpQDILIyqlTs" },
    { name: "Action", icon: Swords, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyNQ8NaRax_Frn8U30Ob2DKz3bxocb6D7JEwNxZtmU-_zQ7j4xVae0ili1-PtlCWQlx06hpGz_lilxO5OpnW6pd0eXOKoO12ydQikFh3EmGV-_-9r7Jd_eHj8nzE399ImQfjzWx0oLI3-jn3xDQMnPWj7hxxA6RlMCRQI1E1rgjFQJs4dOCb_yAZ1QLkQw4wN137xOR9q0VdkVU1E23dTd-EJcjDGFOSKCvwyxOZbnqrqr5A7x9-hXnpMOYeCJXtI5e550bnWZGvM" },
    { name: "Slice of Life", icon: Smile, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyrKKOfbJEWU-_HX_hofszzvmFMJAeRUPW3uBT0rXy8qSqeqLs84Oi8yQ3OJxcN2jQyoljkKBCS_arej2baJI80shADqEgxpAY_LgNsoZ68PCS_fclMSyq58czEVGAs4bRpeYFSlK3r4_0IVJ8DTpuFPuT1Q3iiHF5m05GKG0pJAEilpP7fq-uNw3etr4DMplsUa0yHqG27YRleR8mRoNFUrD_VPs9oTKlrQ5jYnCqOrtZme45Fjmt8ADJfoDbGFptuwUBNPnYXlQ" },
    { name: "Mecha", icon: Bot, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCe28nWCrk9jgMY3C60zqfu35hS5FzWMMQaVxCnvc2D7p1omuyiY2ukDxBXSPj7thViSMXogFXkLkQLxdDk0PSsIX1RW6JbmgaflRgiim2LDY9lR3zEJgW51D64zJC5GF5Vhp9FYDuSv72SuUf17YsHvjmpCesX-_iKlEZlFBNdw4CwWy6IFOwamJrPD8G_Le-shg3eC45CBH1MrvR_KbiH0aCytwpd46nVdI9S1XicGO1rLMFEpe7B1Ap1ueu2JLiBPmuZIiX8F9M" },
    { name: "Horror", icon: Skull, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVh6iUNZ7Sa5Pg7-65X0BFhqlZFE1Qv17V5RtDSQC4rkwMe10rCOoK8VZjuiggwLGjDP5hn_kJqR-NTMru2HRLZ2fw6V0YHDQNUp4WthScIGpL24Nd0ccSbNNvLLxcI63MxdWt1ILJDfJChu3luf4nuB5dn_tjufKAIbImzc2fTado4JKcRAtul433hx555tJ0UJNWIa_at487kBChHIIXSIci_LEmtA5IPAj8f5U9LfJDTo4ZfQXrlBq8aoOg3xvR6Oz-gdYC_vU" },
    { name: "Fantasy", icon: Sparkles, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3B1_ZdY9JDf4Vj2myGE09Bgyha4MfPCwXtTQB9QFC6TztP1XY1xser3eBCJkqi1_-4-MxqcbJlNk5BXsbR-8XKWaC4Ta7GW7sIK9NoDfWY6NIO93jUD9l0LGDXFtOY4aWSXbPzmpE-8YcUYqQRVpqhAUR5a3UyvQuoZQLbSQGFxgEsqQR7H_WDVCDVK7mb2UbRWLR-XliBe7jc01PscTbsgJqbHQf98mii4wD2LquzinQhLOf-1g6lpIx5clKF7vFTlrwnYGmpa4" },
];

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [topSearches, setTopSearches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load default trending items for "Top Searches"
        fetchHome().then(data => {
            if (data?.trendingAnimes) {
                setTopSearches(data.trendingAnimes.slice(0, 10));
            }
        });
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const delay = setTimeout(async () => {
            setLoading(true);
            const data = await fetchSearch(query);

            if (data?.animes) {
                setResults(data.animes);
            }
            setLoading(false);
        }, 500);

        return () => clearTimeout(delay);
    }, [query]);

    const displayList = query.trim().length > 0 ? results : topSearches;
    const isSearching = query.trim().length > 0;

    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar style="light" />

            {/* Search Bar Area */}
            <View className="w-full px-6 pt-16 pb-4 bg-[#09090b] z-20 border-b border-zinc-900">
                <View className="relative">
                    <View className="absolute z-10 left-3 top-0 bottom-0 justify-center">
                        <Search size={22} color="#71717a" />
                    </View>
                    <TextInput
                        className="w-full pl-11 pr-10 py-3 border border-zinc-800/80 rounded-xl bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 text-base"
                        placeholder="Search for anime, characters..."
                        placeholderTextColor="#71717a"
                        value={query}
                        onChangeText={setQuery}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")} className="absolute z-10 right-3 top-0 bottom-0 justify-center">
                            <View className="bg-zinc-800 rounded-full p-1"><X size={14} color="#a1a1aa" /></View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                className="flex-1"
                bounces={true}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {!isSearching && (
                    <View className="px-6 pt-4 mb-6 mt-4">
                        <Text className="text-lg font-bold text-white mb-4">Popular Genres</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {GENRES.map((genre, idx) => {
                                const IconComponent = genre.icon;
                                return (
                                    <TouchableOpacity key={idx} onPress={() => router.push(`/genre?name=${encodeURIComponent(genre.name)}`)} className="bg-zinc-900 rounded-lg p-4 flex-col justify-between h-24 mb-3 w-[48%] border border-zinc-800/60 overflow-hidden relative">
                                        <View className="absolute -right-4 -bottom-4 w-20 h-20 opacity-30 bg-zinc-800" style={{ transform: [{ rotate: '12deg' }] }}>
                                            <ImageBackground source={{ uri: genre.img }} className="w-full h-full object-cover" />
                                        </View>
                                        <IconComponent size={24} color="#a1a1aa" />
                                        <Text className="font-semibold text-zinc-200 z-10 mt-2">{genre.name}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>
                )}

                <View className="px-6 mb-8 mt-4">
                    <Text className="text-lg font-bold text-white mb-4">
                        {isSearching ? `Search Results (${results.length})` : "Top Searches"}
                    </Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#fff" className="mt-4" />
                    ) : (
                        <View className="flex-col gap-3">
                            {displayList.map((item, idx) => (
                                <TouchableOpacity key={item.id || idx} onPress={() => router.push(`/details?id=${item.id}`)} className="flex-row items-center gap-4 p-2 pr-4 rounded-xl bg-zinc-900/40 border border-transparent">
                                    <View className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800">
                                        <Image source={{ uri: item.poster }} className="w-full h-full object-cover" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
                                            {item.type ? `${item.type} • ` : ''}Ep {item.episodes?.sub || 0} Sub
                                        </Text>
                                    </View>
                                    <View className="w-8 h-8 rounded-full border border-zinc-700 items-center justify-center pl-0.5">
                                        <Play size={16} color="#a1a1aa" fill="#a1a1aa" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {isSearching && results.length === 0 && !loading && (
                                <Text className="text-zinc-500 text-center mt-4">No results found for "{query}"</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 w-full z-30">
                <BottomNav />
            </View>
        </View>
    );
}
