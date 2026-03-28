import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#09090b' },
            animation: 'slide_from_right',
            animationDuration: 100,
        }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="home" options={{ animation: 'none' }} />
            <Stack.Screen name="explore" options={{ animation: 'none' }} />
            <Stack.Screen name="search" options={{ animation: 'none' }} />
            <Stack.Screen name="scheduled" options={{ animation: 'none' }} />
            <Stack.Screen name="mylist" options={{ animation: 'none' }} />
            <Stack.Screen name="details" options={{ presentation: 'transparentModal', animation: 'fade_from_bottom' }} />
            <Stack.Screen name="player" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack>
    );
}
