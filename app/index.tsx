import { Text, View, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export default function StartScreen() {
    const router = useRouter();
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous Buffer Rotation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            })
        ).start();

        const navTimer = setTimeout(() => router.replace("/home"), 4500);
        return () => clearTimeout(navTimer);
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View className="flex-1 bg-black items-center justify-center">
            <StatusBar style="light" />

            {/* Central Glass Card */}
            <View className="bg-white/5 border border-white/10 rounded-[50px] p-16 items-center">

                {/* Soft Buffer Ring */}
                <Animated.View
                    style={{ transform: [{ rotate: spin }] }}
                    className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/80 mb-10"
                />

                {/* Elegant Lowercase Logo */}
                <Text style={{ fontFamily: 'Poppins-Light' }} className="text-white text-4xl tracking-[10px] ml-[10px]">
                    kuro
                </Text>

                {/* Sub-status */}
                <Text style={{ fontFamily: 'Poppins-Light' }} className="text-white/20 text-[10px] tracking-[3px] mt-6">
                    fetching your world...
                </Text>
            </View>

            {/* Bottom Signature */}
            <View className="absolute bottom-10">
                <Text style={{ fontFamily: 'Poppins-Thin' }} className="text-white/10 text-[9px] tracking-[5px]">
                    made by aryaniiil
                </Text>
            </View>
        </View>
    );
}