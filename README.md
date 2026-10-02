# History Playlist for Amazon Music

A free Microsoft Edge extension that makes a new playlist from Amazon Music Song History. Version 1.0.0.

On the expanded Song History page (`/recently/played/songs`), a **Make playlist** button opens an in-page panel. You name the playlist and choose how many songs from the top of the list. The extension scrolls Song History so more rows load, skips songs it has already counted, creates a new playlist, adds those songs, then loads that playlist with a full page load.

The toolbar icon opens [Song History](https://music.amazon.com/recently/played/songs) in the current tab when that tab is already Amazon Music, and in a new tab otherwise. The in-page button stays.

It sits with [Find in Playlist for Amazon Music](https://noodlesnom.github.io/find-in-playlist-for-amazon-music/) and [Lyrics Translate & Romanize for Amazon Music](https://noodlesnom.github.io/lyrics-translate-for-amazon-music/). The three buttons stack. This extension does not remove either of the others.

Not affiliated with Amazon.

## Install (load unpacked)

1. Download the latest release ZIP and unzip it (or clone this repository).
2. Open `edge://extensions` (in Chrome: `chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the folder that contains `manifest.json`.
5. Open Amazon Music. Use the toolbar icon, or open Library and the full Song History page. The Make playlist button appears only there.

English Amazon Music sites only: music.amazon.com, .ca, .co.uk, .com.au, .in, and .ae.

## What it does

- Shows **Make playlist** only on expanded Song History.
- Asks for a playlist name and how many songs. An empty count means 25.
- Scrolls the list and keeps unique song ids from the top. Duplicates are skipped.
- Creates a new public playlist, then adds those songs in one request.
- Loads the new playlist with a full page load.
- The toolbar icon opens Song History in the current tab when you are already on Amazon Music, otherwise in a new tab.

## Privacy

The developer collects nothing. Creating the playlist uses the Amazon Music page you already have open. See [the site](https://noodlesnom.github.io/history-playlist-for-amazon-music/).

## License

MIT. Copyright (c) 2026 NoodlesNom.
