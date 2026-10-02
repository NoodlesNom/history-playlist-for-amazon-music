# Edge Add-ons store draft

Do not submit this. Paste it into Partner Center only when you choose to publish.

The short description is not a separate store field you can type. Microsoft Edge Add-ons uses the `description` string in `manifest.json`. That string is already set to the short description below. The extension name in the manifest is already the name below. Version in the package is 1.0.0. This draft was not submitted.

## Name

History Playlist for Amazon Music

## Short description

On Amazon Music Song History, make a new playlist from the songs at the top of the list.

(88 characters. Chromium shows the manifest description in the browser UI with a 132-character limit.)

## Long description

History Playlist for Amazon Music makes a new playlist from Song History on the Amazon Music website.

On the expanded Song History page, a Make playlist button opens a panel. Type a playlist name and how many songs to take from the top of the list. Leave the count empty to use 25. The extension scrolls Song History so songs that are not loaded yet can be included, skips a song it has already counted, creates a new public playlist, and adds those songs. It then opens that playlist with a full page load. It does not play the songs, and it does not edit a playlist you already have.

The toolbar icon opens Song History (https://music.amazon.com/recently/played/songs). If the current tab is already Amazon Music, that tab is used. Otherwise a new tab opens. The in-page Make playlist button stays.

It works alongside Find in Playlist for Amazon Music and Lyrics Translate and Romanize for Amazon Music. The buttons stack. This extension does not remove the others.

There is no account with the developer. The playlist is created with the Amazon Music sign-in already open in the browser. Song titles and track ids are not sent to the developer.

English Amazon Music sites only: music.amazon.com, music.amazon.ca, music.amazon.co.uk, music.amazon.com.au, music.amazon.in, and music.amazon.ae. Not affiliated with Amazon. Amazon Music is a trademark of Amazon.com, Inc. or its affiliates.

## Category suggestion

Productivity.

If that category is not in the dashboard, use Entertainment, because the extension only runs on Amazon Music.

## Search terms (optional)

Up to seven terms, 30 characters each, 21 words total.

1. Amazon music
2. song history
3. playlist
4. history playlist
5. recently played
6. make playlist
7. amazon music history

## Privacy notes

What it does:

- Runs as a content script on the English Amazon Music sites listed above, plus a background click handler for the toolbar icon.
- The button and panel appear only on expanded Song History (`/recently/played/songs`).
- Reads track links already shown on that page, scrolls the page so more rows load, and keeps unique track ids from the top.
- Sends the playlist name and those track ids to Amazon Music (the site already open, including gql.music.amazon) to create a new public playlist and add the songs. Uses the existing Amazon session in that tab. Nothing is stored in extension storage.
- The toolbar icon opens https://music.amazon.com/recently/played/songs in the current tab when that tab is already Amazon Music, otherwise in a new tab.

What it does not do:

- No developer account, no sign-in to the developer, and no analytics.
- Does not send Song History or track ids to the developer.
- Does not read the Amazon password, and does not read pages that are not Amazon Music.
- Does not play, pause, or skip.
- Does not download or display lyrics.

Suggested privacy disclosure for the listing: this extension does not collect or transmit personal data to the developer. Creating a playlist sends the playlist name and the selected track ids to Amazon Music, which is the site the user already has open, solely to make the playlist they asked for.

## Listing fields

NAME (from manifest): History Playlist for Amazon Music
VERSION: 1.0.0
SHORT DESCRIPTION (from manifest description): On Amazon Music Song History, make a new playlist from the songs at the top of the list.

CATEGORY: Productivity
If Productivity is not in the list, use Entertainment.

WEBSITE: https://noodlesnom.github.io/history-playlist-for-amazon-music/
SUPPORT: https://github.com/NoodlesNom/history-playlist-for-amazon-music
MATURE CONTENT: No

VISIBILITY: Public
MARKETS: all markets (leave the default)

SINGLE PURPOSE:
On Amazon Music Song History, make a new playlist from the songs at the top of the list. It runs only on English Amazon Music. The developer does not collect personal data.

HOST / SITE PERMISSION JUSTIFICATION:
music.amazon.com, .ca, .co.uk, .com.au, .in, and .ae are needed so the extension can show the Make playlist button on Song History and open that page from the toolbar icon.
gql.music.amazon.com, .ca, .co.uk, .com.au, .in, and .ae are needed so the extension can ask Amazon Music to create the new playlist and add the selected songs, using the sign-in already in the page. It does not send that data to the developer.

REMOTE CODE: No, I am not using remote code.

DATA COLLECTION: This extension does not collect or transmit personal data to the developer. Do not check data-type boxes for developer collection (no PII, health, financial, authentication, communications, location, web history, user activity, or website content collected by the developer). The playlist name and track ids are sent only to Amazon Music to perform the playlist the user asked for.

CERTIFICATIONS: Check every certification that says the extension does not sell or transfer user data to third parties outside approved use cases, does not use or transfer user data for purposes unrelated to the single purpose, and does not use or transfer user data to determine creditworthiness or for lending. Only check statements that are true. This extension collects nothing for the developer.

PRIVACY POLICY URL: https://noodlesnom.github.io/history-playlist-for-amazon-music/privacy.html

LOGO: icons/icon128.png in this repository (also /workspace/history-playlist-for-amazon-music/icons/icon128.png). 128x128.

PACKAGE: /workspace/history-playlist-edge-1.0.0.zip

SCREENSHOT: /workspace/listing-shots/history-playlist-song-history.png

Do not submit. Do not open Partner Center.

NOTES FOR CERTIFICATION:
No test account is required beyond an Amazon Music account the reviewer already uses. Open https://music.amazon.com/recently/played/songs (Library, Song History, See more). A Make playlist button appears. Enter a name and a small song count, then Create playlist. A new playlist is created and the browser loads it. The extension does not play songs. The toolbar icon opens that Song History URL.
