import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedAnime = {
    id: string;
    name: string;
    poster: string;
    type?: string;
};

export type WatchHistoryItem = {
    id: string;
    name: string;
    poster: string;
    currentEpId: string;
    currentEpNumber: number;
    currentTime: number;
    duration: number;
    watchedAt: number; // timestamp
};

const SAVED_ANIMES_KEY = '@saved_animes';
const WATCH_HISTORY_KEY = '@watch_history';
const PLAYER_SETTINGS_KEY = '@player_settings';

export const storage = {
    // Saved Animes
    getSavedAnimes: async (): Promise<SavedAnime[]> => {
        try {
            const data = await AsyncStorage.getItem(SAVED_ANIMES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error getting saved animes:', e);
            return [];
        }
    },
    saveAnime: async (anime: SavedAnime): Promise<void> => {
        try {
            const current = await storage.getSavedAnimes();
            if (!current.find(a => a.id === anime.id)) {
                await AsyncStorage.setItem(SAVED_ANIMES_KEY, JSON.stringify([anime, ...current]));
            }
        } catch (e) {
            console.error('Error saving anime:', e);
        }
    },
    removeAnime: async (id: string): Promise<void> => {
        try {
            const current = await storage.getSavedAnimes();
            const filtered = current.filter(a => a.id !== id);
            await AsyncStorage.setItem(SAVED_ANIMES_KEY, JSON.stringify(filtered));
        } catch (e) {
            console.error('Error removing anime:', e);
        }
    },
    isAnimeSaved: async (id: string): Promise<boolean> => {
        try {
            const current = await storage.getSavedAnimes();
            return !!current.find(a => a.id === id);
        } catch (e) {
            return false;
        }
    },

    // Watch History
    getWatchHistory: async (): Promise<WatchHistoryItem[]> => {
        try {
            const data = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error getting watch history:', e);
            return [];
        }
    },
    saveWatchHistory: async (item: WatchHistoryItem): Promise<void> => {
        try {
            const current = await storage.getWatchHistory();
            const filtered = current.filter(h => h.id !== item.id);
            await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify([item, ...filtered]));
        } catch (e) {
            console.error('Error saving watch history:', e);
        }
    },
    getAnimeWatchProgress: async (id: string): Promise<WatchHistoryItem | null> => {
        try {
            const current = await storage.getWatchHistory();
            return current.find(h => h.id === id) || null;
        } catch (e) {
            return null;
        }
    },
    clearWatchHistory: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(WATCH_HISTORY_KEY);
        } catch (e) {
            console.error('Error clearing watch history:', e);
        }
    },

    // Player Settings
    getSettings: async () => {
        try {
            const data = await AsyncStorage.getItem(PLAYER_SETTINGS_KEY);
            return data ? JSON.parse(data) : { autoSkip: false, autoNext: false, playbackSpeed: 1 };
        } catch (e) {
            return { autoSkip: false, autoNext: false, playbackSpeed: 1 };
        }
    },
    saveSettings: async (settings: any) => {
        try {
            await AsyncStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }
};
