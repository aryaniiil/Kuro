import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';

interface SubtitleCue {
    start: number;
    end: number;
    text: string;
}

// Parse VTT timestamp to seconds
const parseTimestamp = (ts: string): number => {
    const parts = ts.trim().split(':');
    if (parts.length === 3) {
        const [h, m, s] = parts;
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
    } else if (parts.length === 2) {
        const [m, s] = parts;
        return parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
    }
    return 0;
};

// Parse VTT file content into cues
const parseVTT = (vttContent: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    // Remove BOM and normalize line endings
    const content = vttContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Split into blocks
    const blocks = content.split(/\n\n+/);

    for (const block of blocks) {
        const lines = block.trim().split('\n');
        // Find the timing line (contains -->)
        let timingLineIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('-->')) {
                timingLineIdx = i;
                break;
            }
        }
        if (timingLineIdx === -1) continue;

        const timingLine = lines[timingLineIdx];
        const [startStr, endStr] = timingLine.split('-->').map(s => s.trim().split(' ')[0]);
        if (!startStr || !endStr) continue;

        const start = parseTimestamp(startStr);
        const end = parseTimestamp(endStr);

        // Everything after timing line is the subtitle text
        const textLines = lines.slice(timingLineIdx + 1);
        // Strip HTML tags from subtitle text
        const text = textLines.join('\n').replace(/<[^>]*>/g, '').trim();

        if (text && !isNaN(start) && !isNaN(end)) {
            cues.push({ start, end, text });
        }
    }

    return cues;
};

interface SubtitleOverlayProps {
    player: any;
    subtitleUrl: string | null;
    isLandscape: boolean;
    headers?: Record<string, string>;
}

export default function SubtitleOverlay({ player, subtitleUrl, isLandscape, headers }: SubtitleOverlayProps) {
    const [cues, setCues] = useState<SubtitleCue[]>([]);
    const [currentText, setCurrentText] = useState<string>('');
    const lastCueIdx = useRef(-1);

    // Fetch and parse the VTT file when URL changes
    useEffect(() => {
        setCues([]);
        setCurrentText('');
        lastCueIdx.current = -1;

        if (!subtitleUrl) return;

        const loadSubs = async () => {
            try {
                console.log('[Subs] Fetching:', subtitleUrl);
                const response = await fetch(subtitleUrl, { headers: headers || {} });
                const text = await response.text();
                const parsed = parseVTT(text);
                console.log('[Subs] Parsed', parsed.length, 'cues');
                setCues(parsed);
            } catch (e: any) {
                console.error('[Subs] Error loading subtitles:', e?.message || e);
            }
        };

        loadSubs();
    }, [subtitleUrl]);

    // Sync subtitle display with player time
    useEffect(() => {
        if (cues.length === 0 || !player) return;

        const interval = setInterval(() => {
            const time = player.currentTime || 0;

            // Binary search or linear scan for current cue
            let found = '';
            // Check last known cue first (optimization)
            if (lastCueIdx.current >= 0 && lastCueIdx.current < cues.length) {
                const c = cues[lastCueIdx.current];
                if (time >= c.start && time <= c.end) {
                    found = c.text;
                    setCurrentText(found);
                    return;
                }
            }

            // Linear search (cues are sorted by start time)
            for (let i = 0; i < cues.length; i++) {
                const c = cues[i];
                if (time >= c.start && time <= c.end) {
                    found = c.text;
                    lastCueIdx.current = i;
                    break;
                }
                // Early exit - all future cues are after current time
                if (c.start > time + 1) break;
            }

            setCurrentText(found);
        }, 200); // Check every 200ms for smooth subtitle updates

        return () => clearInterval(interval);
    }, [cues, player]);

    if (!currentText || !subtitleUrl) return null;

    return (
        <View
            className={`absolute z-30 left-0 right-0 items-center pointer-events-none ${isLandscape ? 'bottom-20 px-16' : 'bottom-16 px-6'}`}
            pointerEvents="none"
        >
            <View className="bg-black/75 rounded-lg px-4 py-2 max-w-[90%]">
                <Text className={`text-white text-center font-medium leading-snug ${isLandscape ? 'text-base' : 'text-sm'}`}>
                    {currentText}
                </Text>
            </View>
        </View>
    );
}
