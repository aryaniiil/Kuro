import { View, Text, TouchableOpacity, Image } from "react-native";
import { Home, Search, Bookmark, Calendar, LayoutGrid } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View className="flex-row items-end justify-between py-2 pb-6 px-1 bg-zinc-900/95 border-t border-zinc-800">

            <TouchableOpacity
                onPress={() => router.push("/home")}
                className="flex-1 items-center justify-end gap-1"
            >
                <View className="h-8 items-center justify-center">
                    <Home size={24} color={pathname === "/home" ? "#fafafa" : "#a1a1aa"} strokeWidth={pathname === "/home" ? 2.5 : 2} />
                </View>
                <Text className={`text-[10px] font-medium leading-none ${pathname === "/home" ? "text-white" : "text-zinc-500"}`}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/explore")}
                className="flex-1 items-center justify-end gap-1"
            >
                <View className="h-8 items-center justify-center">
                    <LayoutGrid size={24} color={pathname === "/explore" ? "#fafafa" : "#a1a1aa"} strokeWidth={pathname === "/explore" ? 2.5 : 2} />
                </View>
                <Text className={`text-[10px] font-medium leading-none ${pathname === "/explore" ? "text-white" : "text-zinc-500"}`}>Explore</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/search")}
                className="flex-1 items-center justify-end gap-1"
            >
                <View className="h-8 items-center justify-center">
                    <Search size={24} color={pathname === "/search" ? "#fafafa" : "#a1a1aa"} strokeWidth={pathname === "/search" ? 2.5 : 2} />
                </View>
                <Text className={`text-[10px] font-medium leading-none ${pathname === "/search" ? "text-white" : "text-zinc-500"}`}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/scheduled")}
                className="flex-1 items-center justify-end gap-1"
            >
                <View className="h-8 items-center justify-center">
                    <Calendar size={24} color={pathname === "/scheduled" ? "#fafafa" : "#a1a1aa"} strokeWidth={pathname === "/scheduled" ? 2.5 : 2} />
                </View>
                <Text className={`text-[10px] font-medium leading-none ${pathname === "/scheduled" ? "text-white" : "text-zinc-500"}`}>Scheduled</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/mylist")}
                className="flex-1 items-center justify-end gap-1"
            >
                <View className="h-8 items-center justify-center">
                    <Bookmark size={24} color={pathname === "/mylist" ? "#fafafa" : "#a1a1aa"} strokeWidth={pathname === "/mylist" ? 2.5 : 2} />
                </View>
                <Text className={`text-[10px] font-medium leading-none ${pathname === "/mylist" ? "text-white" : "text-zinc-500"}`}>My List</Text>
            </TouchableOpacity>

        </View>
    );
}
