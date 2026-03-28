const fs = require('fs');

async function main() {
    const epUrl = "https://aniwatch-kappa-five.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=violet-evergarden-recollections-19944%3Fep%3D145635&server=hd-1&category=sub";
    console.log("Fetching episode sources...");
    const res = await fetch(epUrl);
    const json = await res.json();

    if (!json.success && json.status !== 200) {
        console.log("Failed to fetch API:", json);
        return;
    }

    const data = json.data || json;
    const url = data.sources && data.sources[0]?.url;
    if (!url) {
        console.log("No URL found in response.");
        return;
    }

    console.log("Found master M3U8 URL:", url);

    const headers = {
        'Referer': 'https://megacloud.blog/',
        'Origin': 'https://megacloud.blog',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    console.log("Downloading master playlist...");
    const m3u8Res = await fetch(url, { headers });
    const text = await m3u8Res.text();

    fs.writeFileSync('master.m3u8', text);
    console.log("Saved to master.m3u8 successfully!");
    console.log("\nContents preview:\n", text.substring(0, 300));
}

main().catch(console.error);
