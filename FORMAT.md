# Kuro API Response Format Documentation

This document outlines the JSON structures expected by the Kuro application from the backend API. Adhering to these schemas ensures that the frontend can correctly map, display, and play content without internal errors.

## Base URL
The application currently communicates with: `https://anime-api-y650.onrender.com`

---

## 1. Homepage & Lists
Used by: `fetchHome`, `ExploreScreen`  
Endpoints: `/anime/spotlight`, `/anime/recent`, `/anime/trending`, `/anime/popular`

### Expected Item Structure (Results Array)
```json
{
  "results": [
    {
      "id": "12345",
      "title": {
        "english": "Anime Title",
        "romaji": "Anime no Title",
        "native": "アニメタイトル"
      },
      "coverImage": {
        "extraLarge": "https://.../image.jpg",
        "large": "https://.../image_sm.jpg"
      },
      "description": "Short description with optional HTML tags.",
      "format": "TV",
      "status": "FINISHED",
      "seasonYear": 2024,
      "episodes": 12,
      "rank": 1 // Optional for trending/popular
    }
  ]
}
```

---

## 2. Anime Details
Used by: `fetchAnimeInfo`  
Endpoint: `/anime/info/{id}`

### Expected Structure
```json
{
  "id": "12345",
  "title": {
    "english": "Anime Title",
    "romaji": "Anime no Title",
    "userPreferred": "Anime Title"
  },
  "coverImage": {
    "extraLarge": "https://.../poster.jpg"
  },
  "averageScore": 85,
  "format": "TV",
  "episodes": 24,
  "duration": 24,
  "description": "Full synopsis of the anime.",
  "startDate": {
    "year": 2023,
    "month": 10,
    "day": 1
  },
  "studios": {
    "nodes": [{ "name": "Studio Name" }]
  },
  "genres": ["Action", "Adventure"],
  "status": "RELEASING",
  "characters": {
    "edges": [
      {
        "node": {
          "name": { "full": "Character Name" },
          "image": { "large": "https://.../char.jpg" }
        },
        "role": "MAIN"
      }
    ]
  }
}
```

---

## 3. Episode List
Used by: `fetchAnimeEpisodes`  
Endpoint: `/anime/episodes/{id}`

### Expected Structure
The API should return a `providers` object. The app will search for the first provider containing actual episode data in `sub` or `dub`.

```json
{
  "providers": {
    "any-provider-name": {
      "episodes": {
        "sub": [
          {
            "id": "ep-1",
            "number": 1,
            "title": "The Beginning",
            "filler": false
          }
        ],
        "dub": []
      }
    }
  }
}
```

---

## 4. Streaming & Extraction
Used by: `fetchEpisodeSources`  
Endpoint: `/anime/extract/{animeId}?e={episodeId}`

### Expected Structure
The response can be flat or wrapped in `ssub`, `sdub`, or `sraw`. Use the wrapped form for multi-audio support.

```json
{
  "ssub": {
    "streams": [
      {
        "url": "https://.../master.m3u8",
        "type": "hls",
        "referer": "https://optional-referer.com"
      }
    ],
    "subtitles": [
      {
        "file": "https://.../english.vtt",
        "label": "English",
        "language": "en",
        "default": true
      }
    ],
    "intro": {
      "start": 120,
      "end": 210
    },
    "outro": {
      "start": 1350,
      "end": 1440
    }
  }
}
```

---

## 5. Search & Filters
Used by: `fetchSearch`, `fetchGenre`  
Endpoints: `/anime/search?query={q}&page={p}`, `/anime/filter?genre={g}&page={p}`

### Expected Structure
Matches the Homepage structure with an additional pagination flag.

```json
{
  "results": [...],
  "hasNextPage": true
}
```

---

## Implementation Notes
- **Empty States**: Prefer returning an empty array `[]` rather than `null` for list fields.
- **IDs**: IDs should be consistent across `info`, `episodes`, and `extraction` requests.
- **HTML Cleanup**: While the frontend handles CSS/HTML stripping, sending clean text in `description` fields is preferred.
- **M3U8 Support**: Only HLS (`.m3u8`) streams are currently supported by the player.
