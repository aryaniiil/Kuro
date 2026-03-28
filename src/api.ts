const BASE_URL = "https://anime-api-y650.onrender.com";

const apiFetch = async (url: string): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await response.json();
        return json;
    } catch (e: any) {
        clearTimeout(timeoutId);
        console.error("[API] Fetch Error:", url, e?.message || e);
        return null;
    }
};

const FALLBACK_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const mapAnime = (item: any): any => ({
    id: String(item.id),
    name: item.title?.english || item.title?.romaji || item.title?.native || item.title || "Unknown",
    poster: item.coverImage?.extraLarge || item.coverImage?.large || item.image || item.poster || FALLBACK_IMG,
    description: (item.description || "").replace(/<[^>]*>?/gm, ''),
    jname: item.title?.romaji || "",
    type: item.format || "TV",
    otherInfo: [item.format || "TV", item.status || "UNKNOWN", item.seasonYear?.toString() || ""].filter(Boolean),
    episodes: {
        sub: item.episodes || (item.nextAiringEpisode ? item.nextAiringEpisode.episode - 1 : 0) || 0,
        dub: 0
    },
    rank: item.rank || undefined,
});

export const fetchHome = async (): Promise<any> => {
    try {
        const [spotlight, recent, trending, popular] = await Promise.all([
            apiFetch(`${BASE_URL}/anime/spotlight`),
            apiFetch(`${BASE_URL}/anime/recent`),
            apiFetch(`${BASE_URL}/anime/trending`),
            apiFetch(`${BASE_URL}/anime/popular`),
        ]);
        
        return {
            spotlightAnimes: (spotlight?.results || []).map(mapAnime),
            latestEpisodeAnimes: (recent?.results || []).map(mapAnime),
            trendingAnimes: (trending?.results || []).map(mapAnime),
            top10Animes: { today: (popular?.results || popular || []).map(mapAnime).slice(0, 10) }
        };
    } catch {
        return null;
    }
};

export const fetchSchedule = async (date: string): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/schedule?page=1&per_page=50`);
    if (!data?.results) return null;
    
    const scheduledAnimes = data.results.map((r: any) => ({
        id: String(r.media?.id || r.id),
        name: r.media?.title?.english || r.media?.title?.romaji || r.title?.english || r.title?.romaji || "Unknown",
        poster: r.media?.coverImage?.extraLarge || r.media?.coverImage?.large || r.coverImage?.extraLarge || r.coverImage?.large || FALLBACK_IMG,
        time: new Date((r.airingAt || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        airingTimestamp: (r.airingAt || 0) * 1000,
        episode: r.episode,
        secondsUntilAiring: r.timeUntilAiring,
    }));
    return { scheduledAnimes };
};

export const fetchGenre = async (genre: string, page = 1): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/filter?genre=${encodeURIComponent(genre)}&page=${page}`);
    return {
        animes: (data?.results || []).map(mapAnime),
        hasNextPage: data?.hasNextPage || false
    };
};

export const fetchSearch = async (query: string, page = 1): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/search?query=${encodeURIComponent(query)}&page=${page}`);
    return {
        animes: (data?.results || []).map(mapAnime),
        hasNextPage: data?.hasNextPage || false
    };
};

export const fetchAdvancedSearch = async (params: Record<string, string | number>): Promise<any> => {
    const queryStr = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
    const data = await apiFetch(`${BASE_URL}/anime/filter?${queryStr}`);
    return {
        animes: (data?.results || []).map(mapAnime),
        hasNextPage: data?.hasNextPage || false
    };
};

export const fetchAnimeInfo = async (id: string): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/info/${id}`);
    if (!data) return null;
    
    // Strip HTML tags from description (like <br>, <i>, etc.)
    const cleanDescription = (data.description || "No description available.").replace(/<[^>]*>?/gm, '');

    return {
        anime: {
            info: {
                id: String(data.id),
                name: data.title?.english || data.title?.romaji || data.title?.native || data.title?.userPreferred || "Unknown",
                poster: data.coverImage?.extraLarge || data.coverImage?.large || FALLBACK_IMG,
                stats: {
                    quality: "HD",
                    type: data.format || "TV",
                    rating: data.averageScore ? (data.averageScore / 10).toFixed(1) : "N/A",
                    episodes: { sub: data.episodes || 0, dub: 0 },
                    duration: data.duration ? `${data.duration}m` : "Unknown"
                },
                description: cleanDescription,
                characterVoiceActor: (data.characters?.edges || []).map((edge: any) => ({
                    character: {
                        name: edge.node?.name?.full || edge.node?.name?.userPreferred || "Unknown",
                        cast: edge.role || "Main",
                        poster: edge.node?.image?.large || FALLBACK_IMG
                    }
                }))
            },
            moreInfo: {
                aired: data.startDate?.year ? `${data.startDate.year}-${data.startDate.month}-${data.startDate.day}` : "Unknown",
                studios: data.studios?.nodes?.[0]?.name || data.studios?.edges?.[0]?.node?.name || "Unknown",
                genres: data.genres || [],
                status: data.status || "UNKNOWN"
            }
        }
    };
};

export const fetchAnimeEpisodes = async (id: string): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/episodes/${id}`);
    if (!data || !data.providers) return null;
    
    let providerEps: any[] = [];
    const providers = Object.values(data.providers);
    for (const provider of providers) {
        if ((provider as any)?.episodes?.sub?.length > 0) {
            // prioritize providers that actually have episode arrays
            providerEps = (provider as any).episodes.sub;
            break;
        } else if ((provider as any)?.episodes?.dub?.length > 0) {
            providerEps = (provider as any).episodes.dub;
            break;
        }
    }

    if (!providerEps.length) return null;

    return {
        episodes: providerEps.map((ep: any) => ({
            episodeId: String(ep.number || ep.id),
            number: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            isFiller: ep.filler || false
        }))
    };
};

export const fetchEpisodeServers = async (episodeId: string): Promise<any> => {
    return {
        sub: [{ serverName: "Kuhi", serverId: "kuhi-1" }],
        dub: []
    };
};

export const fetchEpisodeSources = async (animeId: string, episodeId: string, server = "hd-1", category = "sub"): Promise<any> => {
    // Kuhi API expects: /anime/extract/{query}?e={episode_number}
    const url = `${BASE_URL}/anime/extract/${animeId}?e=${episodeId}`;
    const data = await apiFetch(url);
    if (!data) return null;
    
    // The API might wrap the result in ssub, sdub, or sraw
    const result = data.ssub || data.sdub || data.sraw || data;
    
    if (!result.streams || result.streams.length === 0) return null;
    
    return {
        sources: result.streams.map((s: any) => ({
            url: s.url,
            isM3U8: s.type === 'hls' || s.url.includes('.m3u8'),
            quality: 'auto'
        })),
        subtitles: (result.subtitles || []).map((s: any) => ({
            url: s.file || s.url,
            lang: s.label || s.language || s.lang || "Unknown",
            isDefault: s.default || false
        })),
        intro: result.intro || null,
        outro: result.outro || null,
        headers: result.streams[0]?.referer ? { Referer: result.streams[0].referer } : {}
    };
};

export const fetchM3U8AndParseQualities = async (masterUrl: string, headers: Record<string, string> = {}): Promise<any> => {
    try {
        const res = await fetch(masterUrl, { headers });
        if (!res.ok) return [{ quality: 'Auto', url: masterUrl }];

        const m3u8Text = await res.text();
        const lines = m3u8Text.split('\n');

        const parsedSources: { quality: string, url: string }[] = [];
        let currentQuality = '';

        // Base URL to resolve relative playlist URLs
        const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                // Extract RESOLUTION if available, else look for BANDWIDTH rough estimates or NAME
                const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                if (resMatch && resMatch[1]) {
                    currentQuality = `${resMatch[1]}p`;
                } else {
                    currentQuality = `Stream ${parsedSources.length + 1}`;
                }
            } else if (!line.startsWith('#')) {
                // This is a URL line right after a STREAM-INF specifier
                if (currentQuality) {
                    const absUrl = line.startsWith('http') ? line : baseUrl + line;
                    parsedSources.push({ quality: currentQuality, url: absUrl });
                    currentQuality = ''; // reset
                }
            }
        }

        // Return sorted (highest to lowest, roughly) plus Auto at the top
        return [
            { quality: 'Auto', url: masterUrl },
            ...parsedSources.reverse()
        ];
    } catch (e) {
        console.error("Failed parsing m3u8:", e);
        return [{ quality: 'Auto', url: masterUrl }];
    }
};
