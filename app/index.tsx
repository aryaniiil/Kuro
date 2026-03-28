import { ActivityIndicator, Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const FUNNY_LINES = [
    "Warming up the ramen-powered servers...",
    "Negotiating with anime gods for no filler arcs...",
    "Polishing subtitles so they look dramatic...",
    "Checking if power levels are over 9000...",
    "Summoning your next obsession..."
];

export default function StartScreen() {
    const router = useRouter();
    const [lineIndex, setLineIndex] = useState(0);
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        const lineTimer = setInterval(() => {
            setLineIndex((prev) => (prev + 1) % FUNNY_LINES.length);
        }, 1500);

        const dotsTimer = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4);
        }, 350);

        const navTimer = setTimeout(() => {
            router.replace("/home");
        }, 4200);

        return () => {
            clearInterval(lineTimer);
            clearInterval(dotsTimer);
            clearTimeout(navTimer);
        };
    }, [router]);

    return (
        <View className="flex-1 bg-[#09090b] items-center justify-center px-8">
            <StatusBar style="light" />
            <Image source={require("../assets/logo.png")} className="w-20 h-20 mb-6" resizeMode="contain" />
            <Text className="text-white text-2xl font-bold tracking-tight mb-6">Kuro</Text>
            <ActivityIndicator size="large" color="#fafafa" />
            <Text className="text-zinc-300 text-sm mt-5 text-center min-h-[40px]">{FUNNY_LINES[lineIndex]}</Text>
            <Text className="text-zinc-500 text-xs mt-2">Loading your next episode{".".repeat(dotCount)}</Text>
        </View>
    );
}
