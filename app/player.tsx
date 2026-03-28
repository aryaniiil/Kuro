import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Modal, ActivityIndicator, TouchableWithoutFeedback, Pressable, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Settings, Play, Pause, RotateCcw, RotateCw, BookmarkPlus, Subtitles, Maximize, Minimize, X, Check, ChevronRight } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer, VideoView } from 'expo-video';
import Slider from '@react-native-community/slider';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAnimeInfo, fetchAnimeEpisodes, fetchEpisodeServers, fetchEpisodeSources, fetchM3U8AndParseQualities } from "../src/api";
import { storage } from "../src/hooks/useStorage";



import SubtitleOverlay from "../src/components/SubtitleOverlay";

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Modern Bottom-Sheet Style Menu
const ModalMenu = ({ visible, onClose, title, isLandscape, children }: any) => (
    <Modal visible={visible} transparent animationType={isLandscape ? "fade" : "slide"}>
        <View className={`flex-1 ${isLandscape ? 'justify-start items-end' : 'justify-end'}`}>
            <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={onClose} />
            <View className={`bg-zinc-900 border-zinc-800 shadow-lg ${isLandscape ? 'w-[45%] h-full border-l px-6 pt-6 pb-6 rounded-l-3xl' : 'rounded-t-[32px] border-t pb-10 pt-4 px-6 w-full max-h-[70%]'}`}>
                {!isLandscape && (
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                    </View>
                )}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white text-2xl font-bold tracking-tight">{title}</Text>
                    <TouchableOpacity onPress={onClose} className="p-2.5 bg-zinc-800 rounded-full">
                        <X size={20} color="#a1a1aa" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity activeOpacity={1}>
                        {children}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    </Modal>
);

const BottomControls = ({ player, duration, isLandscape, setShowSubs, setShowSettings, toggleOrientation, animeTitle, episodeInfo, currentQuality, intro, outro }: any) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (player && !isSliding) {
                setCurrentTime(player.currentTime || 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [player, isSliding]);

    const onSliderValueChange = (val: number) => setCurrentTime(val);
    const onSlidingComplete = (val: number) => {
        player.currentTime = val;
        setIsSliding(false);
    };

    return (
        <View className={`absolute left-0 right-0 z-20 w-full pointer-events-box-none ${isLandscape ? 'bottom-0 pb-8 px-6' : 'bottom-4 px-4'}`} pointerEvents="box-none">
            {isLandscape && <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute bottom-0 left-0 right-0 h-40 z-[-1]" pointerEvents="none" />}

            {isLandscape && (
                <View className="w-full h-12 justify-center mb-[-8px] relative mx-1">
                    <View style={{ position: 'absolute', left: 15, right: 15, top: 0, bottom: 0, zIndex: 10 }} pointerEvents="none">
                        {intro && intro.end > 0 && duration > 0 && (
                            <View style={{ position: 'absolute', top: '50%', marginTop: -3, left: `${(intro.start / duration) * 100}%`, width: `${((intro.end - intro.start) / duration) * 100}%`, height: 6, backgroundColor: 'white', borderRadius: 3 }} />
                        )}
                        {outro && outro.end > 0 && duration > 0 && (
                            <View style={{ position: 'absolute', top: '50%', marginTop: -3, left: `${(outro.start / duration) * 100}%`, width: `${((outro.end - outro.start) / duration) * 100}%`, height: 6, backgroundColor: 'white', borderRadius: 3 }} />
                        )}
                    </View>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={duration}
                        value={currentTime}
                        onValueChange={onSliderValueChange}
                        onSlidingStart={() => setIsSliding(true)}
                        onSlidingComplete={onSlidingComplete}
                        minimumTrackTintColor="#ffffff"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#ffffff"
                    />
                </View>
            )}

            <View className={`flex-row items-end justify-between w-full pointer-events-box-none ${!isLandscape ? 'mb-2' : ''}`} pointerEvents="box-none">
                <View pointerEvents="none" className={isLandscape ? "mb-1" : ""}>
                    <Text className={`font-semibold drop-shadow-md ${isLandscape ? 'text-white/90 text-sm' : 'text-white text-xs'}`}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>
                </View>

                <View className={`flex-row items-center pointer-events-box-none ${isLandscape ? 'gap-6' : 'gap-4'}`} pointerEvents="box-none">

                    <TouchableOpacity onPress={() => setShowSubs(true)} className="p-3 px-4 -m-3">
                        <Subtitles size={isLandscape ? 28 : 22} color="white" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleOrientation} className="p-3 px-4 -m-3 ml-0.5">
                        {isLandscape ? <Minimize size={28} color="white" strokeWidth={1.5} /> : <Maximize size={22} color="white" />}
                    </TouchableOpacity>
                </View>
            </View>

            {!isLandscape && (
                <View className="h-6 justify-center bg-transparent mt-[-10px] relative mx-1">
                    <View style={{ position: 'absolute', left: 15, right: 15, top: 0, bottom: 0, zIndex: 10 }} pointerEvents="none">
                        {intro && intro.end > 0 && duration > 0 && (
                            <View style={{ position: 'absolute', top: '50%', marginTop: -3, left: `${(intro.start / duration) * 100}%`, width: `${((intro.end - intro.start) / duration) * 100}%`, height: 6, backgroundColor: 'white', borderRadius: 3 }} />
                        )}
                        {outro && outro.end > 0 && duration > 0 && (
                            <View style={{ position: 'absolute', top: '50%', marginTop: -3, left: `${(outro.start / duration) * 100}%`, width: `${((outro.end - outro.start) / duration) * 100}%`, height: 6, backgroundColor: 'white', borderRadius: 3 }} />
                        )}
                    </View>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={duration}
                        value={currentTime}
                        onValueChange={onSliderValueChange}
                        onSlidingStart={() => setIsSliding(true)}
                        onSlidingComplete={onSlidingComplete}
                        minimumTrackTintColor="#ffffff"
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                        thumbTintColor="#ffffff"
                    />
                </View>
            )}
        </View>
    );
};

export default function Player() {
    const router = useRouter();
    const { id, epId } = useLocalSearchParams();

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [isPlaying, setIsPlaying] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [duration, setDuration] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [showSubs, setShowSubs] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [isLoadingSource, setIsLoadingSource] = useState(true);
    const lastTap = useRef<{ time: number, side: string } | null>(null);
    const [seekRipple, setSeekRipple] = useState<{ visible: boolean, side: 'left' | 'right', text: string }>({ visible: false, side: 'right', text: '' });
    const rippleTimeout = useRef<NodeJS.Timeout | null>(null);

    // Prevent state updates/player replace when component unmounts
    const isMounted = useRef(true);
    const savedTimeForResume = useRef<number | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Dynamic data state
    const [animeTitle, setAnimeTitle] = useState("Loading...");
    const [animeInfo, setAnimeInfo] = useState<any>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<any>(null);
    const [currentEpId, setCurrentEpId] = useState<string>(epId as string || "");

    // Sources & quality
    const [sources, setSources] = useState<any[]>([]);
    const [selectedSourceIdx, setSelectedSourceIdx] = useState(0);
    const [currentQuality, setCurrentQuality] = useState<string>("Auto");
    const sourceHeaders = useRef<Record<string, string>>({});

    // Subtitles
    const [subtitles, setSubtitles] = useState<any[]>([]);
    const [selectedSubIdx, setSelectedSubIdx] = useState(-1); // -1 = off

    // Auto Play & Skip
    const [intro, setIntro] = useState<{ start: number, end: number } | null>(null);
    const [outro, setOutro] = useState<{ start: number, end: number } | null>(null);
    const [autoSkipIntro, setAutoSkipIntro] = useState(false);
    const [autoNext, setAutoNext] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Load initial settings
    useEffect(() => {
        storage.getSettings().then((settings) => {
            setAutoSkipIntro(settings.autoSkip || false);
            setAutoNext(settings.autoNext || false);
            setPlaybackSpeed(settings.playbackSpeed || 1);
            if (player) {
                player.playbackRate = settings.playbackSpeed || 1;
            }
        });
    }, []);

    const toggleSetting = (key: 'autoSkip' | 'autoNext', val: boolean) => {
        if (key === 'autoSkip') setAutoSkipIntro(val);
        if (key === 'autoNext') setAutoNext(val);
        storage.saveSettings({ autoSkip: key === 'autoSkip' ? val : autoSkipIntro, autoNext: key === 'autoNext' ? val : autoNext, playbackSpeed });
    };

    const updateSpeedSetting = (speed: number) => {
        setPlaybackSpeed(speed);
        player.playbackRate = speed;
        storage.saveSettings({ autoSkip: autoSkipIntro, autoNext, playbackSpeed: speed });
    };

    // Servers
    const [servers, setServers] = useState<any>(null);
    const [selectedServer, setSelectedServer] = useState("hd-1");
    const [selectedCategory, setSelectedCategory] = useState("sub");

    // Episodes Pagination
    const [selectedChunk, setSelectedChunk] = useState(0);
    const EPISODES_PER_CHUNK = 100;

    // Auto-select correct chunk based on current episode
    useEffect(() => {
        if (currentEpId && episodes.length > 0) {
            const epIndex = episodes.findIndex((ep: any) => ep.episodeId === currentEpId);
            if (epIndex >= 0) {
                const chunkIndex = Math.floor(epIndex / EPISODES_PER_CHUNK);
                setSelectedChunk(chunkIndex);
            }
        }
    }, [currentEpId, episodes]);

    const showSeekRipple = (side: 'left' | 'right', text: string) => {
        setSeekRipple({ visible: true, side, text });
        if (rippleTimeout.current) clearTimeout(rippleTimeout.current);
        rippleTimeout.current = setTimeout(() => {
            setSeekRipple(prev => ({ ...prev, visible: false }));
        }, 500);
    };

    const handleVideoPress = (e: any) => {
        const { locationX } = e.nativeEvent;
        const screenWidth = isLandscape ? Math.max(width, height) : Math.min(width, height);

        let side = 'center';
        if (locationX < screenWidth * 0.3) side = 'left';
        else if (locationX > screenWidth * 0.7) side = 'right';

        const now = Date.now();
        if (lastTap.current && lastTap.current.side === side && side !== 'center' && now - lastTap.current.time < 300) {
            if (side === 'left') {
                seek(-10);
                showSeekRipple('left', '-10s');
            }
            if (side === 'right') {
                seek(10);
                showSeekRipple('right', '+10s');
            }
            lastTap.current = null;
        } else {
            lastTap.current = { time: now, side };
            setShowControls(prev => !prev);
        }
    };

    // Initialize player with no source, will replace source once loaded
    const player = useVideoPlayer(null, (player) => {
        player.loop = false;
        player.bufferOptions = {
            preferredForwardBufferDuration: 60,
            waitsToMinimizeStalling: false,
            minBufferForPlayback: 1,
            maxBufferBytes: 0,
        };
        player.pause();
    });

    // Load episode sources for a given episodeId
    const loadEpisodeSources = useCallback(async (episodeId: string, server = "hd-1", category = "sub") => {
        setIsLoadingSource(true);
        setIsBuffering(true);
        console.log("[Player] Loading sources for:", episodeId, "server:", server, "category:", category);

        let sourcesData = null;
        let retries = 0;
        while (!sourcesData && isMounted.current && retries < 15) {
            const temp = await fetchEpisodeSources(id as string, episodeId, server, category);

            // Validate that we actually got a stream URL, not just a successful empty JSON payload
            const m3u8Src = temp?.sources?.find((s: any) => s.isM3U8) || temp?.sources?.[0];
            if (temp && temp.sources && temp.sources.length > 0 && m3u8Src?.url) {
                sourcesData = temp;
            } else {
                console.log(`[Player] Scraping busy or empty URL, retrying... (${++retries})`);
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }

        if (retries >= 15) {
            console.error("[Player] Failed to load sources after 15 retries");
            setIsLoadingSource(false);
            setIsBuffering(false);
            return;
        }

        if (!isMounted.current || !sourcesData) return;
        console.log("[Player] Sources data received");

        setIntro(sourcesData.intro || null);
        setOutro(sourcesData.outro || null);

        // Build headers for the video player from API response + defaults
        const hdrs: Record<string, string> = {
            'Referer': 'https://megacloud.blog/',
            'Origin': 'https://megacloud.blog',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36',
            ...(sourcesData.headers || {}),
        };
        sourceHeaders.current = hdrs;
        console.log("[Player] Using headers:", Object.keys(hdrs));

        // Handle sources
        if (sourcesData.sources?.length > 0) {
            // Pick the master source
            const m3u8Src = sourcesData.sources.find((s: any) => s.isM3U8) || sourcesData.sources[0];

            // Parse master quality URLs instead of raw source objects
            const parsedSources = await fetchM3U8AndParseQualities(m3u8Src.url, hdrs);
            setSources(parsedSources);

            const defaultSrc = parsedSources[0]; // Usually 'Auto'
            setSelectedSourceIdx(0);
            setCurrentQuality(defaultSrc.quality);

            console.log("[Player] Playing URL:", defaultSrc.url);

            if (isMounted.current) {
                player.replace({ uri: defaultSrc.url, headers: hdrs });
                player.play();
            }
        }

        // Handle subtitles - API uses 'tracks' or 'subtitles' field
        const rawSubs = sourcesData.subtitles || sourcesData.tracks || [];
        // Filter out non-subtitle tracks (like thumbnails)
        const validSubs = rawSubs.filter((s: any) => s.lang && s.lang.toLowerCase() !== 'thumbnails');
        if (validSubs.length > 0) {
            setSubtitles(validSubs);
            // Auto-select English subtitles if available
            const engIdx = validSubs.findIndex((s: any) =>
                s.lang?.toLowerCase().includes('english')
            );
            setSelectedSubIdx(engIdx >= 0 ? engIdx : -1);
        } else {
            setSubtitles([]);
            setSelectedSubIdx(-1);
        }
        setIsLoadingSource(false);
    }, [player]);

    // 1. Load anime info and list of episodes when `id` is available
    useEffect(() => {
        if (!id) return;

        const loadAnimeData = async () => {
            // Load anime info
            fetchAnimeInfo(id as string).then(infoData => {
                if (infoData?.anime?.info) {
                    setAnimeTitle(infoData.anime.info.name);
                    setAnimeInfo(infoData.anime);
                }
            });

            // Load episode list
            const epsData = await fetchAnimeEpisodes(id as string);
            if (epsData?.episodes?.length > 0) {
                setEpisodes(epsData.episodes);

                // Use the epId from params, or fallback to the first episode if not passed
                const targetEpId = (epId as string) || epsData.episodes[0].episodeId;

                const matchedEp = epsData.episodes.find((ep: any) => ep.episodeId === targetEpId);
                if (matchedEp) {
                    setCurrentEpisode(matchedEp);
                    setCurrentEpId(matchedEp.episodeId);
                } else {
                    setCurrentEpisode(epsData.episodes[0]);
                    setCurrentEpId(epsData.episodes[0].episodeId);
                }

                // Check for saved progress to resume playback
                const historyInfo = await storage.getAnimeWatchProgress(id as string);
                if (historyInfo && historyInfo.currentEpId === targetEpId && historyInfo.currentTime > 5) {
                    savedTimeForResume.current = historyInfo.currentTime;
                }
            }
        };

        loadAnimeData();
    }, [id, epId]);

    // 2. Load exact source video & servers whenever `currentEpId` changes
    useEffect(() => {
        if (!currentEpId) return;

        const loadVideoData = async () => {
            // Fetch servers first to guarantee we request an available server and category
            const serverData = await fetchEpisodeServers(currentEpId);
            if (serverData) {
                setServers(serverData);

                let targetCategory = selectedCategory;
                let targetServer = selectedServer;

                // Validate or fallback category
                if (!serverData[targetCategory] || serverData[targetCategory].length === 0) {
                    if (serverData['sub'] && serverData['sub'].length > 0) targetCategory = 'sub';
                    else if (serverData['raw'] && serverData['raw'].length > 0) targetCategory = 'raw';
                    else if (serverData['dub'] && serverData['dub'].length > 0) targetCategory = 'dub';
                    setSelectedCategory(targetCategory);
                }

                // Validate or fallback server
                const serverExists = serverData[targetCategory]?.some((s: any) => s.serverName === targetServer);
                if (!serverExists && serverData[targetCategory]?.length > 0) {
                    targetServer = serverData[targetCategory][0].serverName;
                    setSelectedServer(targetServer);
                }

                // Load video source based on validated servers
                await loadEpisodeSources(currentEpId, targetServer, targetCategory);
            } else {
                // If fetch fails, try anyway with defaults
                await loadEpisodeSources(currentEpId, selectedServer, selectedCategory);
            }
        };

        loadVideoData();
    }, [currentEpId]);

    // Switch to a different episode
    const switchEpisode = useCallback(async (episode: any) => {
        setCurrentEpisode(episode);
        setCurrentEpId(episode.episodeId);
        setDuration(1);

        // Load servers for new episode
        const serverData = await fetchEpisodeServers(episode.episodeId);
        if (serverData) {
            setServers(serverData);
        }

        // Load sources for new episode
        await loadEpisodeSources(episode.episodeId, selectedServer, selectedCategory);
    }, [loadEpisodeSources, selectedServer, selectedCategory]);

    const playNextEpisode = useCallback(() => {
        if (!currentEpId || !episodes.length) return;
        const index = episodes.findIndex((ep: any) => ep.episodeId === currentEpId);
        if (index >= 0 && index < episodes.length - 1) {
            switchEpisode(episodes[index + 1]);
        }
    }, [currentEpId, episodes, switchEpisode]);

    // Interval to check auto skips
    useEffect(() => {
        const interval = setInterval(() => {
            if (player && duration > 0) {
                const t = player.currentTime;
                // Auto skip intro
                if (intro && autoSkipIntro && t >= intro.start && t < intro.end) {
                    player.currentTime = intro.end;
                }
                // Auto skip outro
                if (outro && autoSkipIntro && t >= outro.start && t < outro.end) {
                    player.currentTime = outro.end;
                }
                // Next Episode
                if (autoNext && duration > 10 && t >= duration - 2) {
                    playNextEpisode();
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [player, duration, intro, outro, autoSkipIntro, autoNext, playNextEpisode]);

    // Switch quality/source
    const switchSource = useCallback((idx: number) => {
        setSelectedSourceIdx(idx);
        const selectedSrc = sources[idx];
        if (selectedSrc) {
            const currentTime = player.currentTime;
            setCurrentQuality(selectedSrc.quality);
            // Save current time for resume after replacement
            savedTimeForResume.current = currentTime;
            player.replace({ uri: selectedSrc.url, headers: sourceHeaders.current });
            player.play();
        }
        setShowSettings(false);
    }, [sources, player]);

    // Switch server/category
    const switchServer = useCallback(async (server: string, category: string) => {
        setSelectedServer(server);
        setSelectedCategory(category);
        if (currentEpId) {
            await loadEpisodeSources(currentEpId, server, category);
        }
        setShowSettings(false);
    }, [currentEpId, loadEpisodeSources]);

    // FIX: Unlocks orientation globally when the component unmounts (leaving the screen)
    useEffect(() => {
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useEffect(() => {
        let controlsTimeout: NodeJS.Timeout;
        if (showControls && isPlaying) {
            controlsTimeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(controlsTimeout);
    }, [showControls, isPlaying]);

    useEffect(() => {
        const playSub = player.addListener('playingChange', (event) => setIsPlaying(event.isPlaying));
        const statusSub = player.addListener('statusChange', (event) => {
            if (event.status === 'readyToPlay' || event.status === 'idle') {
                setIsBuffering(false);

                // Resume playback if we have a saved time queue
                if (event.status === 'readyToPlay' && savedTimeForResume.current && player.duration) {
                    if (savedTimeForResume.current < player.duration - 10) {
                        player.currentTime = savedTimeForResume.current;
                    }
                    savedTimeForResume.current = null;
                }
            } else if (event.status === 'loading') {
                setIsBuffering(true);
            }
            if (player.duration) {
                setDuration(player.duration);
            }
        });

        return () => {
            playSub.remove();
            statusSub.remove();
        };
    }, [player]);

    const togglePlay = () => {
        if (isPlaying) player.pause();
        else player.play();
    };

    // Periodically save history
    useEffect(() => {
        const interval = setInterval(() => {
            if (player && currentEpId && currentEpisode && animeTitle !== "Loading..." && player.duration > 0) {
                // Don't save if we barely started
                if (player.currentTime > 5) {
                    storage.saveWatchHistory({
                        id: id as string,
                        name: animeTitle,
                        poster: animeInfo?.info?.poster || "",
                        currentEpId,
                        currentEpNumber: currentEpisode?.number || 1,
                        currentTime: player.currentTime,
                        duration: player.duration,
                        watchedAt: Date.now()
                    });
                }
            }
        }, 8000); // Check and save every 8 seconds

        return () => clearInterval(interval);
    }, [player, currentEpId, currentEpisode, animeTitle, animeInfo, id]);

    const seek = (seconds: number) => {
        player.currentTime = Math.max(0, Math.min(player.currentTime + seconds, duration));
    };

    const toggleOrientation = async () => {
        if (isLandscape) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
    };

    // Build settings menu options
    const serverCategories = ['sub', 'dub', 'raw'];
    const availableServers = servers ? serverCategories.filter(cat =>
        servers[cat] && servers[cat].length > 0
    ) : [];

    return (
        <View className="flex-1 bg-zinc-950">
            <StatusBar style="light" hidden={isLandscape} />

            {/* SETTINGS MODAL - Quality & Server Selection */}
            <ModalMenu
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                title="Video Settings"
                isLandscape={isLandscape}
            >
                {/* Quality Section */}
                {sources.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Quality</Text>
                        {sources.map((src: any, idx: number) => {
                            const isActive = selectedSourceIdx === idx;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => switchSource(idx)}
                                    className={`flex-row items-center justify-between py-4 px-5 rounded-2xl mb-2 ${isActive ? 'bg-white/10 border border-white/30' : 'bg-zinc-800/40 border border-zinc-800'}`}
                                >
                                    <Text className={`text-base font-semibold ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                                        {src.quality}
                                    </Text>
                                    {isActive && <Check size={20} color="white" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Automation & Skip Settings */}
                <View className="mb-6">
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Automation</Text>
                    <View className="flex-row justify-between mb-3">
                        <View className="flex-1 mr-2 bg-zinc-800/40 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between">
                            <Text className="text-zinc-200 font-semibold text-sm">Auto Skip I/O</Text>
                            <TouchableOpacity onPress={() => toggleSetting('autoSkip', !autoSkipIntro)} className={`px-4 py-1.5 rounded-lg border ${autoSkipIntro ? 'bg-white border-white' : 'border-zinc-500 bg-transparent'}`}>
                                <Text className={`font-bold text-xs ${autoSkipIntro ? 'text-black' : 'text-zinc-400'}`}>{autoSkipIntro ? 'ON' : 'OFF'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="flex-1 ml-2 bg-zinc-800/40 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between">
                            <Text className="text-zinc-200 font-semibold text-sm">Auto Next</Text>
                            <TouchableOpacity onPress={() => toggleSetting('autoNext', !autoNext)} className={`px-4 py-1.5 rounded-lg border ${autoNext ? 'bg-white border-white' : 'border-zinc-500 bg-transparent'}`}>
                                <Text className={`font-bold text-xs ${autoNext ? 'text-black' : 'text-zinc-400'}`}>{autoNext ? 'ON' : 'OFF'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Playback Speed */}
                <View className="mb-4">
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Playback Speed</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed, idx) => (
                            <TouchableOpacity
                                key={`speed-${speed}-${idx}`}
                                onPress={() => updateSpeedSetting(speed)}
                                className={`px-4 py-2.5 rounded-xl ${playbackSpeed === speed ? 'bg-white/10 border border-white/30' : 'bg-zinc-800/40 border border-zinc-800'}`}
                            >
                                <Text className={`text-sm font-semibold ${playbackSpeed === speed ? 'text-white' : 'text-zinc-300'}`}>
                                    {speed}x
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ModalMenu>

            {/* SUBTITLES MODAL */}
            <ModalMenu
                visible={showSubs}
                onClose={() => setShowSubs(false)}
                title="Subtitles & CC"
                isLandscape={isLandscape}
            >
                <TouchableOpacity
                    onPress={() => { setSelectedSubIdx(-1); setShowSubs(false); }}
                    className={`flex-row items-center justify-between py-4 px-5 rounded-2xl mb-2 ${selectedSubIdx === -1 ? 'bg-white/10 border border-white/30' : 'bg-zinc-800/40 border border-zinc-800'}`}
                >
                    <Text className={`text-base font-semibold ${selectedSubIdx === -1 ? 'text-white' : 'text-zinc-200'}`}>Off</Text>
                    {selectedSubIdx === -1 && <Check size={20} color="white" />}
                </TouchableOpacity>
                {subtitles.map((sub: any, idx: number) => (
                    <TouchableOpacity
                        key={`sub-${sub.lang || idx}-${idx}`}
                        onPress={() => { setSelectedSubIdx(idx); setShowSubs(false); }}
                        className={`flex-row items-center justify-between py-4 px-5 rounded-2xl mb-2 ${selectedSubIdx === idx ? 'bg-white/10 border border-white/30' : 'bg-zinc-800/40 border border-zinc-800'}`}
                    >
                        <Text className={`text-base font-semibold ${selectedSubIdx === idx ? 'text-white' : 'text-zinc-200'}`}>
                            {sub.lang}
                        </Text>
                        {selectedSubIdx === idx && <Check size={20} color="white" />}
                    </TouchableOpacity>
                ))}
                {subtitles.length === 0 && (
                    <Text className="text-zinc-500 text-center py-6">No subtitles available for this source</Text>
                )}
            </ModalMenu>

            {/* SINGLE UNIFIED VIDEO VIEW CONTAINER - PREVENTS RELOADING ON ROTATE */}
            <View
                className={`bg-black relative ${isLandscape ? 'flex-1 w-full h-full' : 'w-full'}`}
                style={!isLandscape ? { height: '35%', paddingTop: insets.top } : {}}
            >
                <VideoView
                    player={player}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                    contentFit="contain" // Always use contain to prevent cropping
                    nativeControls={false}
                />

                <SubtitleOverlay
                    player={player}
                    subtitleUrl={selectedSubIdx >= 0 ? subtitles[selectedSubIdx]?.url : null}
                    isLandscape={isLandscape}
                    headers={sourceHeaders.current}
                />

                {/* LOADING / BUFFERING INDICATOR */}
                {(isBuffering || isLoadingSource) && (
                    <View pointerEvents="none" className="absolute inset-0 items-center justify-center z-10" style={{ top: isLandscape ? 0 : insets.top }}>
                        <View className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
                            <ActivityIndicator size="large" color="white" />
                        </View>
                        {isLoadingSource && (
                            <Text className="text-white/60 text-xs mt-3 font-medium">Loading episode...</Text>
                        )}
                    </View>
                )}

                {/* DOUBLE TAP FULL SCREEN INVISIBLE GESTURE ZONE */}
                <Pressable
                    className="absolute inset-0 z-10"
                    style={{ top: isLandscape ? 0 : insets.top }}
                    onPress={handleVideoPress}
                >
                    <View className={`absolute inset-0 bg-black/40 ${showControls ? 'opacity-100' : 'opacity-0'}`} />
                </Pressable>

                {/* DOUBLE TAP SEEK VISUAL RIPPLE */}
                {seekRipple.visible && (
                    <View
                        className={`absolute top-0 bottom-0 z-[15] w-[45%] items-center justify-center bg-white/5 ${seekRipple.side === 'left' ? 'left-0 rounded-r-[100px]' : 'right-0 rounded-l-[100px]'}`}
                        pointerEvents="none"
                        style={{ top: isLandscape ? 0 : insets.top }}
                    >
                        <View className="items-center justify-center p-4 bg-black/30 rounded-full">
                            {seekRipple.side === 'left' ? <RotateCcw size={42} color="white" /> : <RotateCw size={42} color="white" />}
                            <Text className="text-white font-bold mt-2 text-lg">{seekRipple.text}</Text>
                        </View>
                    </View>
                )}

                {/* UNIFIED CONTROLS OVERLAY - STAYS MOUNTED FOR INSTANT RELIABILITY */}
                <View
                    className={`absolute inset-0 z-20 flex justify-between ${showControls ? 'opacity-100' : 'opacity-0'}`}
                    style={{ top: isLandscape ? 0 : insets.top }}
                    pointerEvents={showControls ? 'box-none' : 'none'}
                >
                    {/* Top Bar */}
                    <View className={`flex-row items-center justify-between z-20 w-full pointer-events-box-none ${isLandscape ? 'px-6 pt-6' : 'p-4'}`} pointerEvents="box-none">
                        {isLandscape && <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} className="absolute top-0 left-0 right-0 h-32 z-[-1]" pointerEvents="none" />}
                        <View className="flex-row items-center" pointerEvents="box-none">
                            <TouchableOpacity onPress={() => router.back()} className={`items-center justify-center rounded-full mr-2 ${isLandscape ? 'p-2' : 'w-10 h-10 bg-black/30'}`}>
                                <ArrowLeft size={isLandscape ? 28 : 24} color="white" />
                            </TouchableOpacity>
                            {isLandscape && (
                                <View className="flex-col pb-1 ml-1" pointerEvents="none">
                                    <Text className="text-white text-xl font-bold drop-shadow-md tracking-wide" numberOfLines={1}>
                                        {animeTitle}
                                    </Text>
                                    <View className="flex-row items-center gap-2 mt-1">
                                        <Text className="text-zinc-200 text-sm font-medium drop-shadow-md">Episode {currentEpisode?.number || '?'}</Text>
                                        {currentEpisode?.title && (
                                            <>
                                                <View className="w-1.5 h-1.5 rounded-full bg-zinc-400 drop-shadow-md" />
                                                <Text className="text-zinc-300 text-sm font-medium drop-shadow-md" numberOfLines={1}>{currentEpisode.title}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => setShowSettings(true)} className={`items-center justify-center rounded-full ${isLandscape ? 'p-2' : 'w-10 h-10 bg-black/30'}`}>
                            <Settings size={isLandscape ? 26 : 24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Center Play Controls */}
                    <View className="absolute inset-0 flex-row items-center justify-center z-10 pointer-events-box-none" pointerEvents="box-none" style={{ gap: isLandscape ? 48 : 32 }}>
                        <TouchableOpacity onPress={() => seek(-10)} className="rounded-full p-4">
                            <RotateCcw size={isLandscape ? 42 : 36} color="rgba(255,255,255,0.95)" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={togglePlay}
                            className="w-16 h-16 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full flex items-center justify-center"
                        >
                            {isPlaying ? <Pause size={36} color="white" fill="white" /> : <Play size={36} color="white" fill="white" className="ml-1" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => seek(10)} className="rounded-full p-4">
                            <RotateCw size={isLandscape ? 42 : 36} color="rgba(255,255,255,0.95)" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Controls */}
                    <BottomControls
                        player={player}
                        duration={duration}
                        isLandscape={isLandscape}
                        setShowSubs={setShowSubs}
                        setShowSettings={setShowSettings}
                        toggleOrientation={toggleOrientation}
                        animeTitle={animeTitle}
                        episodeInfo={currentEpisode}
                        currentQuality={currentQuality}
                        intro={intro}
                        outro={outro}
                    />
                </View>
            </View>

            {/* Portrait Info Content */}
            {!isLandscape && (
                <ScrollView className="flex-1 bg-zinc-950" showsVerticalScrollIndicator={false}>
                    <View className="p-5 pb-20">
                        {/* Title & Info */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-start mb-2">
                                <Text className="text-2xl font-bold tracking-tight text-white flex-1 mr-4" numberOfLines={2}>{animeTitle}</Text>
                            </View>
                            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400 font-medium">
                                <Text className="text-white">Episode {currentEpisode?.number || '?'}</Text>
                                {currentEpisode?.title && (
                                    <>
                                        <View className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <Text className="text-zinc-400" numberOfLines={1}>{currentEpisode.title}</Text>
                                    </>
                                )}
                                {animeInfo?.moreInfo?.status && (
                                    <>
                                        <View className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <Text className="text-zinc-400">{animeInfo.moreInfo.status}</Text>
                                    </>
                                )}
                            </View>
                            <View className="flex-row gap-2 mt-4">
                                <View className="px-2 py-0.5 border border-zinc-700 rounded">
                                    <Text className="text-[10px] font-bold text-zinc-400">{currentQuality}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedCategory(selectedCategory === 'sub' ? 'dub' : 'sub')}
                                    className="px-2 py-0.5 border border-zinc-700 rounded"
                                >
                                    <Text className="text-[10px] font-bold text-zinc-400 uppercase">{selectedCategory}</Text>
                                </TouchableOpacity>
                                {subtitles.length > 0 && (
                                    <View className="px-2 py-0.5 border border-zinc-700 rounded">
                                        <Text className="text-[10px] font-bold text-zinc-400">CC</Text>
                                    </View>
                                )}
                            </View>
                            {animeInfo?.info?.description && (
                                <Text className="mt-4 text-zinc-400 text-sm leading-relaxed" numberOfLines={3}>
                                    {animeInfo.info.description?.replace(/<[^>]*>?/gm, '')}
                                </Text>
                            )}
                        </View>

                        <View className="h-[1px] bg-zinc-800 w-full mb-6" />

                        {/* Server Selection */}
                        {servers && (
                            <View className="mb-8">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-semibold text-white">Audio & Servers</Text>

                                    {/* Sub/Dub/Raw Tabs */}
                                    <View className="flex-row bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                        {['sub', 'dub', 'raw'].filter(cat => servers[cat] && servers[cat].length > 0).map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                onPress={() => {
                                                    const newSrv = servers[cat][0]?.serverName;
                                                    if (newSrv) switchServer(newSrv, cat);
                                                }}
                                                className={`px-3 py-1.5 rounded-md ${selectedCategory === cat ? 'bg-zinc-700' : ''}`}
                                            >
                                                <Text className={`text-xs font-bold uppercase ${selectedCategory === cat ? 'text-white' : 'text-zinc-500'}`}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Server Pills */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 flex-row">
                                    {(servers[selectedCategory] || []).map((srv: any) => {
                                        const isActive = selectedServer === srv.serverName;
                                        return (
                                            <TouchableOpacity
                                                key={srv.serverId}
                                                onPress={() => switchServer(srv.serverName, selectedCategory)}
                                                className={`mr-3 px-4 py-2.5 rounded-xl border ${isActive ? 'bg-white/10 border-white/30' : 'bg-zinc-800/40 border-zinc-800'}`}
                                            >
                                                <Text className={`text-sm font-semibold capitalize ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                                                    {srv.serverName}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {/* Empty flex spacer to ensure last item is fully visible when scrolling */}
                                    <View className="w-5" />
                                </ScrollView>
                            </View>
                        )}

                        <View className="h-[1px] bg-zinc-800 w-full mb-6" />

                        {/* Episode List - Compact Grid */}
                        <View className="mb-6">
                            <Text className="text-lg font-semibold text-white mb-4">Episodes ({episodes.length})</Text>

                            {/* Chunk Selection Tabs */}
                            {episodes.length > EPISODES_PER_CHUNK && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
                                    {Array.from({ length: Math.ceil(episodes.length / EPISODES_PER_CHUNK) }).map((_, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => setSelectedChunk(i)}
                                            className={`mr-2 px-4 py-2 rounded-lg border ${selectedChunk === i ? 'bg-white border-white' : 'bg-zinc-800/80 border-zinc-700/50'}`}
                                        >
                                            <Text className={`text-xs font-bold tracking-wider ${selectedChunk === i ? 'text-black' : 'text-zinc-400'}`}>
                                                {i * EPISODES_PER_CHUNK + 1}-{Math.min((i + 1) * EPISODES_PER_CHUNK, episodes.length)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <View className="flex-row flex-wrap gap-2">
                                {episodes.slice(selectedChunk * EPISODES_PER_CHUNK, (selectedChunk + 1) * EPISODES_PER_CHUNK).map((ep: any, idx: number) => {
                                    const isCurrentEp = ep.episodeId === currentEpId;
                                    return (
                                        <TouchableOpacity
                                            key={`ep-${ep.episodeId || idx}-${idx}`}
                                            onPress={() => switchEpisode(ep)}
                                            className={`w-12 h-12 rounded-lg items-center justify-center ${isCurrentEp ? 'bg-white' : ep.isFiller ? 'bg-zinc-800 border border-yellow-600/40' : 'bg-zinc-800/80 border border-zinc-700/50'}`}
                                        >
                                            <Text className={`text-sm font-bold ${isCurrentEp ? 'text-black' : 'text-zinc-300'}`}>
                                                {ep.number}
                                            </Text>
                                            {ep.isFiller && !isCurrentEp && (
                                                <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-500" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {currentEpisode?.title && (
                                <Text className="text-zinc-400 text-sm mt-3">
                                    <Text className="text-white font-semibold">Ep {currentEpisode.number}: </Text>
                                    {currentEpisode.title}
                                    {currentEpisode.isFiller && <Text className="text-yellow-500"> (Filler)</Text>}
                                </Text>
                            )}
                        </View>

                        <View className="h-[1px] bg-zinc-800 w-full mb-6" />

                        {/* Comments placeholder */}
                        <View className="space-y-6">
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-lg font-semibold text-white">Comments <Text className="text-zinc-500 text-sm font-normal ml-1">1.2k</Text></Text>
                                <TouchableOpacity><Text className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sort by Top</Text></TouchableOpacity>
                            </View>

                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="w-8 h-8 rounded-full bg-zinc-700 items-center justify-center">
                                    <Text className="text-white text-xs font-bold">U</Text>
                                </View>
                                <View className="flex-1 h-10 bg-zinc-900 rounded-full justify-center px-4 border border-zinc-800"><Text className="text-sm text-zinc-500">Add a comment...</Text></View>
                            </View>

                            <View className="items-center justify-center py-8">
                                <Text className="text-zinc-500 text-sm font-medium">Comments coming soon...</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
