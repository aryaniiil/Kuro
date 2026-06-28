const BASE_URL = "https://anime-scraper-v2.vercel.app";

const DEBUG = true;
function log(...args: any[]) {
    if (DEBUG) console.log("[API]", ...args);
}

const apiFetch = async (url: string, timeoutMs = 30000): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    log("FETCH:", url.slice(0, 100));
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await response.json();
        log("OK:", url.slice(0, 60), "status:", response.status);
        return json;
    } catch (e: any) {
        clearTimeout(timeoutId);
        console.error("[API] Fetch Error:", url.slice(0, 60), e?.message || e);
        return null;
    }
};

const FALLBACK_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const PROVIDER_NAMES = ["auto", "koto", "neko", "egg", "pahe", "rea", "anidb"];

const extractArray = (d: any): any[] => {
    const arr = d?.results || d?.media || d?.anime || [];
    return Array.isArray(arr) ? arr : [];
};

const mapAnime = (item: any): any => {
    if (!item) return null;
    return {
        id: String(item.id ?? ''),
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
    };
};

export const fetchHome = async (): Promise<any> => {
    try {
        const [spotlight, recent, trending, popular] = await Promise.all([
            apiFetch(`${BASE_URL}/anime/spotlight`),
            apiFetch(`${BASE_URL}/anime/recent`),
            apiFetch(`${BASE_URL}/anime/trending`),
            apiFetch(`${BASE_URL}/anime/popular`),
        ]);
        
        log("fetchHome: spotlight null?", !spotlight, "recent null?", !recent, "trending null?", !trending, "popular null?", !popular);
        
        const spotlightAnimes = extractArray(spotlight).map(mapAnime).filter(Boolean);
        const latestEpisodeAnimes = extractArray(recent).map(mapAnime).filter(Boolean);
        const trendingAnimes = extractArray(trending).map(mapAnime).filter(Boolean);
        const top10today = extractArray(popular).map(mapAnime).filter(Boolean).slice(0, 10);
        
        log("fetchHome: spotlight", spotlightAnimes.length, "recent", latestEpisodeAnimes.length, "trending", trendingAnimes.length, "top10", top10today.length);
        
        return {
            spotlightAnimes,
            latestEpisodeAnimes,
            trendingAnimes,
            top10Animes: { today: top10today }
        };
    } catch (e: any) {
        console.error("[API] fetchHome crashed:", e?.message || e);
        return null;
    }
};

export const fetchSchedule = async (date: string): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/schedule?page=1&per_page=50`);
    const items = extractArray(data);
    if (!items.length) return null;
    
    const scheduledAnimes = items.map((r: any) => ({
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
        animes: extractArray(data).map(mapAnime),
        hasNextPage: data?.pageInfo?.hasNextPage || false
    };
};

export const fetchSearch = async (query: string, page = 1): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/search?query=${encodeURIComponent(query)}&page=${page}`);
    return {
        animes: extractArray(data).map(mapAnime),
        hasNextPage: data?.pageInfo?.hasNextPage || false
    };
};

export const fetchAdvancedSearch = async (params: Record<string, string | number>): Promise<any> => {
    const queryStr = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
    const data = await apiFetch(`${BASE_URL}/anime/filter?${queryStr}`);
    return {
        animes: extractArray(data).map(mapAnime),
        hasNextPage: data?.pageInfo?.hasNextPage || false
    };
};

export const fetchAnimeInfo = async (id: string): Promise<any> => {
    const data = await apiFetch(`${BASE_URL}/anime/info/${id}`);
    if (!data) return null;
    
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
    if (!data) return null;
    
    const skipKeys = ['page', 'type', 'mappings', 'total', 'hasNextPage'];
    const providerKeys = Object.keys(data).filter(k => !skipKeys.includes(k));
    log("fetchAnimeEpisodes providers:", providerKeys);
    
    let providerEps: any[] = [];
    for (const key of providerKeys) {
        const p = data[key];
        if (p?.episodes?.sub?.length > 0) {
            providerEps = p.episodes.sub;
            break;
        } else if (p?.episodes?.dub?.length > 0) {
            providerEps = p.episodes.dub;
            break;
        }
    }
    log("fetchAnimeEpisodes count:", providerEps.length);

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
    log("fetchEpisodeServers for ep:", episodeId);
    // Return real providers with sub/dub
    return {
        sub: PROVIDER_NAMES.map((name) => ({
            serverName: name,
            serverId: name,
        })),
        dub: PROVIDER_NAMES.map((name) => ({
            serverName: name,
            serverId: name,
        })),
    };
};

const fetchM3U8Qualities = async (m3u8Url: string, referer: string): Promise<{ url: string; quality: string; isM3U8: boolean }[] | null> => {
    try {
        const proxyUrl = `${BASE_URL}/proxy/m3u8?url=${encodeURIComponent(m3u8Url)}&referer=${encodeURIComponent(referer)}`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(tid);
        if (!res.ok) return null;
        const text = await res.text();
        const lines = text.split('\n');
        const qualities: { url: string; quality: string; isM3U8: boolean }[] = [];
        let currentQuality = '';

        for (const line of lines) {
            const s = line.trim();
            if (!s) continue;
            if (s.startsWith('#EXT-X-STREAM-INF:')) {
                const m = s.match(/RESOLUTION=\d+x(\d+)/);
                const n = s.match(/NAME="([^"]+)"/);
                currentQuality = n ? n[1] : m ? `${m[1]}p` : `Stream ${qualities.length + 1}`;
            } else if (!s.startsWith('#')) {
                const abs = s.startsWith('/proxy/') ? `${BASE_URL}${s}` : s;
                qualities.push({ url: abs, quality: currentQuality || 'Auto', isM3U8: true });
                currentQuality = '';
            }
        }
        return qualities.length ? qualities : null;
    } catch (e) {
        log("fetchM3U8Qualities error:", (e as any)?.message);
        return null;
    }
};

const tryExtract = async (animeId: string, episodeId: string, provider: string, category: string): Promise<any> => {
    const p = provider && provider !== 'auto' ? `&provider=${provider}` : '';
    const url = `${BASE_URL}/anime/extract/${animeId}?e=${episodeId}${p}&audio=${category}`;
    log("tryExtract:", provider || "any");
    const data = await apiFetch(url, 60000);
    if (!data) return null;
    const result = data.ssub || data.sdub || data.sraw || data;
    if (result?.streams?.length > 0) {
        return { result, provider: data.provider || provider };
    }
    return null;
};

const fetchDirectM3U8Qualities = async (m3u8Url: string, referer: string): Promise<{ url: string; quality: string; isM3U8: boolean }[] | null> => {
    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(m3u8Url, { signal: controller.signal, headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(tid);
        if (!res.ok) return null;
        const text = await res.text();
        const lines = text.split('\n');
        const qualities: { url: string; quality: string; isM3U8: boolean }[] = [];
        let currentQuality = '';
        const base = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
        for (const line of lines) {
            const s = line.trim();
            if (!s) continue;
            if (s.startsWith('#EXT-X-STREAM-INF:')) {
                const m = s.match(/RESOLUTION=\d+x(\d+)/);
                const n = s.match(/NAME="([^"]+)"/);
                currentQuality = n ? n[1] : m ? `${m[1]}p` : `Stream ${qualities.length + 1}`;
            } else if (!s.startsWith('#')) {
                const abs = s.startsWith('http') ? s : base + s;
                qualities.push({ url: abs, quality: currentQuality || 'Auto', isM3U8: true });
                currentQuality = '';
            }
        }
        return qualities.length ? qualities : null;
    } catch (e) {
        log("fetchDirectM3U8Qualities error:", (e as any)?.message);
        return null;
    }
};

export const fetchEpisodeSources = async (animeId: string, episodeId: string, server = "hd-1", category = "sub"): Promise<any> => {
    log("fetchEpisodeSources called:", { animeId, episodeId, server, category });

    let extResult: any = null;
    const providersToTry = server === 'auto' ? ['auto', 'neko', 'koto'] : [server];
    for (const prov of providersToTry) {
        extResult = await tryExtract(animeId, episodeId, prov, category);
        if (extResult) break;
    }
    
    if (!extResult) {
        log("fetchEpisodeSources: no streams from any provider");
        return null;
    }
    
    const { result, provider } = extResult;
    const firstStream = result.streams[0];
    const referer = firstStream?.referer || '';
    log("fetchEpisodeSources: got streams from", provider, "count:", result.streams.length);

    // Build sources - use DIRECT CDN URLs (ExoPlayer can't reach localhost via ADB reverse for segment requests)
    let sources = result.streams.map((s: any) => ({
        url: s.url,
        isM3U8: s.type === 'hls' || s.url?.includes('.m3u8'),
        quality: s.quality || 'auto'
    }));
    
    // Parse quality variants by fetching master m3u8 directly from CDN
    const parsed = await fetchDirectM3U8Qualities(firstStream.url, referer);
    if (parsed) {
        sources = parsed;
        sources.unshift({ url: firstStream.url, quality: 'Auto', isM3U8: true });
        log("fetchEpisodeSources: parsed", sources.length, "quality variants (incl. Auto)");
    }
    
    return {
        sources,
        subtitles: (result.subtitles || []).map((s: any) => ({
            url: `${BASE_URL}/proxy/segment?url=${encodeURIComponent(s.file || s.url)}&referer=https://megaplay.buzz/`,
            lang: s.label || s.language || s.lang || "Unknown",
            isDefault: s.default || false
        })),
        intro: result.intro || null,
        outro: result.outro || null,
        headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36' }
    };
};

export const fetchM3U8AndParseQualities = async (masterUrl: string, headers: Record<string, string> = {}): Promise<any> => {
    log("fetchM3U8AndParseQualities:", masterUrl.slice(0, 80));
    try {
        const res = await fetch(masterUrl, { headers });
        log("m3u8 response status:", res.status);
        if (!res.ok) {
            log("m3u8 fetch failed, returning Auto");
            return [{ quality: 'Auto', url: masterUrl }];
        }

        const m3u8Text = await res.text();
        log("m3u8 text length:", m3u8Text.length);
        const lines = m3u8Text.split('\n');

        const parsedSources: { quality: string, url: string }[] = [];
        let currentQuality = '';

        const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                if (resMatch && resMatch[1]) {
                    currentQuality = `${resMatch[1]}p`;
                } else {
                    currentQuality = `Stream ${parsedSources.length + 1}`;
                }
            } else if (!line.startsWith('#')) {
                if (currentQuality) {
                    const absUrl = line.startsWith('http') ? line : baseUrl + line;
                    parsedSources.push({ quality: currentQuality, url: absUrl });
                    currentQuality = '';
                }
            }
        }

        log("parsed qualities:", parsedSources.map(s => s.quality));
        return [
            { quality: 'Auto', url: masterUrl },
            ...parsedSources.reverse()
        ];
    } catch (e) {
        console.error("Failed parsing m3u8:", e);
        return [{ quality: 'Auto', url: masterUrl }];
    }
};

export { PROVIDER_NAMES };
