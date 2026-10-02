// Amazon Music History Playlist.
// Song History only: path contains /recently/played/songs and the page title is Song History.
// Scrolls that list the way Find in Playlist scrolls search results, then creates an empty
// playlist and appendTracks the collected ids in one call.
(function () {
  'use strict';

  const WEB_API_KEY = 'amzn1.application.4ff5579ca2e3407aba989a1f5dbdaf69';
  const CREATE_MUTATION = 'mutation PlaylistModalCreatePlaylist($title: String!, $description: String, $visibility: String, $trackAsins: [String]) { createPlaylist(title: $title, description: $description, visibility: $visibility, trackAsins: $trackAsins) { id title url } }';
  // Amazon's UI sends one id as trackIds: [$trackId]. The field itself is a list.
  const APPEND_MUTATION = 'mutation addTrackToPlaylist($id: String!, $trackIds: [String], $rejectDuplicateTracks: Boolean) { appendTracks(playlistId: $id, trackIds: $trackIds, rejectDuplicateTracks: $rejectDuplicateTracks) { id trackCount } }';
  const TRACK_HREF = /\/tracks\/([^/?#]+)/;

  let btn = null;
  let pop = null;
  let busy = false;
  let generation = 0;

  function tld() {
    const match = location.hostname.match(/\.amazon\.(com|ca|com\.br|com\.mx|co\.uk|de|fr|it|es|in|co\.jp|com\.au|ae)$/);
    return match ? match[1] : 'com';
  }

  function parentOf(n) {
    if (!n) return null;
    if (n.parentElement) return n.parentElement;
    const root = n.getRootNode && n.getRootNode();
    return (root && root.host) || null;
  }

  function deepQueryAll(selector, root) {
    const out = [];
    const seen = new Set();
    const walk = (node) => {
      if (!node || !node.querySelectorAll) return;
      node.querySelectorAll(selector).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          out.push(el);
        }
      });
      node.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) walk(el.shadowRoot);
      });
    };
    walk(root || document);
    return out;
  }

  function attr(el, name) {
    if (!el || !el.getAttribute) return '';
    const v = el.getAttribute(name);
    return v == null ? '' : String(v).trim();
  }

  function onHistory() {
    const path = location.pathname || '';
    if (path.indexOf('/recently/played/songs') === -1) return false;
    const title = (document.title || '').replace(/\s+/g, ' ').trim();
    if (title === 'Song History' || title.indexOf('Song History') === 0) return true;
    const heads = document.querySelectorAll('h1, h2, [role="heading"]');
    for (let i = 0; i < heads.length; i++) {
      const text = (heads[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'Song History') return true;
    }
    return false;
  }

  function isOurs(el) {
    return !!(el && el.closest && el.closest('.amhp-btn, .amhp-pop'));
  }

  function isPlayerChrome(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const id = attr(n, 'data-testid');
      const tag = (n.tagName || '').toUpperCase();
      if (/MiniPlayer|NowPlaying|Transport|PlaybackControls|PlayerBar|Stage_Overlays/i.test(id)) return true;
      if (tag === 'MUSIC-PLAYBACK-CONTAINER' || tag === 'MUSIC-PLAYBACK-CONTAINER-ITEM') return true;
      if (n.id && /transport|player-bar|playback/i.test(n.id)) return true;
      n = parentOf(n);
    }
    return false;
  }

  function trackIdFromHref(href) {
    if (!href) return '';
    let path = String(href);
    try {
      if (/^https?:/i.test(path)) {
        const url = new URL(path);
        path = url.pathname + url.search;
      }
    } catch (err) { /* keep raw */ }
    const match = TRACK_HREF.exec(path);
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch (err) { return match[1]; }
  }

  function hrefOf(el) {
    if (!el) return '';
    const direct = attr(el, 'href') || attr(el, 'primary-href');
    if (direct) return direct;
    if (el.shadowRoot) {
      const a = el.shadowRoot.querySelector('a[href], [href], [primary-href]');
      if (a) return attr(a, 'href') || attr(a, 'primary-href');
    }
    return '';
  }

  function rowRoot(el) {
    let n = el;
    let found = el;
    while (n && n !== document.body && n !== document.documentElement) {
      const test = attr(n, 'data-testid');
      const tag = (n.tagName || '').toUpperCase();
      if (/^HorizontalItem/.test(test) || test === 'ListItem' || tag === 'MUSIC-IMAGE-ROW' || tag === 'MUSIC-HORIZONTAL-ITEM' || tag === 'MUSIC-TRACK-LIST-ROW') {
        found = n;
        break;
      }
      n = parentOf(n);
    }
    return found;
  }

  // One song row: a history row whose own link is /tracks/<Track.id>.
  // Artist, album, and playlist links are not song ids. Player-bar links are not history.
  function insideScroller(scroller, row) {
    if (!scroller) return true;
    if (scroller === document.body || scroller === document.documentElement || scroller === document.scrollingElement) return true;
    let n = row;
    while (n) {
      if (n === scroller) return true;
      n = parentOf(n);
    }
    return false;
  }

  // Mounted song rows in this scroller, top to bottom. A virtual list only
  // mounts a window, so callers must scroll slowly and keep ids already seen.
  function songRowsInView(scroller) {
    const nodes = deepQueryAll('a[href*="/tracks/"], [href*="/tracks/"], [primary-href*="/tracks/"]');
    const rows = [];
    const seen = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (isOurs(node) || isPlayerChrome(node)) continue;
      const id = trackIdFromHref(hrefOf(node));
      if (!id) continue;
      const row = rowRoot(node);
      if (!row || seen.has(row) || isOurs(row) || isPlayerChrome(row)) continue;
      if (scroller && !insideScroller(scroller, row)) continue;
      const rect = row.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) continue;
      seen.add(row);
      rows.push({ id: id, top: rect.top, left: rect.left });
    }
    rows.sort((a, b) => (a.top - b.top) || (a.left - b.left));
    return rows;
  }

  function canScroll(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.scrollHeight <= el.clientHeight + 24) return false;
    const oy = getComputedStyle(el).overflowY;
    if (oy === 'visible') return false;
    return true;
  }

  function scrollParent(el) {
    let n = parentOf(el);
    while (n && n !== document.body && n !== document.documentElement) {
      if (canScroll(n)) return n;
      n = parentOf(n);
    }
    const se = document.scrollingElement;
    if (se && se.scrollHeight > se.clientHeight + 24) return se;
    return null;
  }

  function largestScroller(rows) {
    let best = null;
    let range = 0;
    for (let i = 0; i < rows.length; i++) {
      let n = rows[i];
      while (n && n !== document.documentElement) {
        if (n.nodeType === 1) {
          const span = n.scrollHeight - n.clientHeight;
          if (span > range) {
            range = span;
            best = n;
          }
        }
        n = parentOf(n);
      }
    }
    return range > 24 ? best : null;
  }

  function anchorElements() {
    return deepQueryAll('a[href*="/tracks/"], [href*="/tracks/"], [primary-href*="/tracks/"]').filter((el) => {
      return !isOurs(el) && !isPlayerChrome(el) && trackIdFromHref(hrefOf(el));
    }).map(rowRoot);
  }

  function pickScroller() {
    const rows = anchorElements();
    const big = largestScroller(rows);
    if (big) return big;
    const groups = new Map();
    for (let i = 0; i < rows.length; i++) {
      const sc = scrollParent(rows[i]);
      if (!sc) continue;
      if (!groups.has(sc)) groups.set(sc, 0);
      groups.set(sc, groups.get(sc) + 1);
    }
    let best = null;
    let score = -1;
    groups.forEach((count, sc) => {
      const s = count * 100 + (sc.scrollHeight || 0) / 10;
      if (s > score) {
        score = s;
        best = sc;
      }
    });
    if (best) return best;
    const se = document.scrollingElement;
    if (se && se.scrollHeight > se.clientHeight + 24) return se;
    return null;
  }

  function atBottom(scroller) {
    if (!scroller) return true;
    const max = scroller.scrollHeight - scroller.clientHeight;
    return scroller.scrollTop >= max - 4;
  }

  function advance(scroller) {
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const before = scroller.scrollTop;
    const delta = Math.max(120, Math.floor(scroller.clientHeight * 0.55));
    scroller.scrollTop = Math.min(max, before + delta);
    let moved = scroller.scrollTop - before;
    if (moved < 2) {
      try {
        scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: delta, bubbles: true, cancelable: true }));
      } catch (err) { /* ignore */ }
      moved = scroller.scrollTop - before;
    }
    try { scroller.dispatchEvent(new Event('scroll', { bubbles: true })); } catch (err) { /* ignore */ }
    return moved;
  }

  function wait(ms) {
    return new Promise((resolve) => { window.setTimeout(resolve, ms); });
  }

  async function collectSongs(want, onProgress, gen) {
    const ids = [];
    const seen = new Set();
    let scroller = null;
    for (let warm = 0; warm < 8; warm++) {
      scroller = pickScroller() || scroller;
      if (scroller) scroller.scrollTop = 0;
      await wait(200);
      if (songRowsInView(scroller).length) break;
    }
    let stagnant = 0;
    const started = Date.now();
    for (let step = 0; step < 400; step++) {
      if (gen !== generation) throw new Error('Cancelled.');
      if (!onHistory()) throw new Error('Left Song History before the songs were collected.');
      const sc = pickScroller() || scroller;
      const before = ids.length;
      const rows = songRowsInView(sc);
      for (let i = 0; i < rows.length; i++) {
        if (seen.has(rows[i].id)) continue;
        seen.add(rows[i].id);
        ids.push(rows[i].id);
        if (ids.length >= want) break;
      }
      onProgress(ids.length, want);
      if (ids.length >= want) return ids.slice(0, want);
      const grew = ids.length > before;
      if (!sc) {
        if (!grew) break;
        continue;
      }
      if (atBottom(sc)) {
        const heightBefore = sc.scrollHeight;
        const maxNow = Math.max(0, sc.scrollHeight - sc.clientHeight);
        sc.scrollTop = Math.max(0, maxNow - 40);
        await wait(60);
        sc.scrollTop = Math.max(0, sc.scrollHeight - sc.clientHeight);
        try {
          sc.dispatchEvent(new WheelEvent('wheel', { deltaY: 480, bubbles: true, cancelable: true }));
          sc.dispatchEvent(new Event('scroll', { bubbles: true }));
        } catch (err) { /* ignore */ }
        await wait(280);
        const grewHeight = sc.scrollHeight > heightBefore + 24;
        if (grewHeight || !atBottom(sc)) {
          stagnant = 0;
          continue;
        }
        stagnant += 1;
        if (stagnant >= 4) break;
        continue;
      }
      const moved = advance(sc);
      await wait(grew ? 140 : 220);
      if (moved < 2 && !grew) {
        stagnant += 1;
        if (stagnant >= 4) break;
      } else if (grew) {
        stagnant = 0;
      }
      if (Date.now() - started > 120000) {
        throw new Error('Scrolling stopped before ' + want + ' unique songs were loaded (found ' + ids.length + ').');
      }
    }
    return ids;
  }

  async function loadWebConfig() {
    try {
      if (window.amznMusic && window.amznMusic.configPromise) {
        const cached = await window.amznMusic.configPromise;
        if (cached && !cached.redirectUrl) return cached;
      }
    } catch (err) { /* fall through */ }
    const url = new URL(location.href);
    url.pathname = '/config.json';
    url.search = '';
    url.searchParams.set('clientApplication', 'hornet');
    url.searchParams.set('skipToken', 'true');
    const res = await fetch(url.href, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Amazon Music config was not available (' + res.status + ').');
    return res.json();
  }

  async function gql(operationName, query, variables) {
    const config = await loadWebConfig();
    const headers = {
      'content-type': 'application/json',
      accept: 'application/graphql-response+json, application/json;q=0.9',
      'x-api-key': WEB_API_KEY
    };
    if (config) {
      if (config.deviceId) headers['x-amzn-device-id'] = config.deviceId;
      if (config.deviceType) headers['x-amzn-device-type'] = config.deviceType;
      if (config.sessionId) headers['x-amzn-session-id'] = config.sessionId;
      if (config.musicTerritory) headers['music-territory'] = config.musicTerritory;
      if (config.csrf) {
        if (config.csrf.rnd) headers['csrf-rnd'] = config.csrf.rnd;
        if (config.csrf.token) headers['csrf-token'] = config.csrf.token;
        if (config.csrf.ts != null) headers['csrf-ts'] = String(config.csrf.ts);
      }
    }
    const base = 'https://gql.music.amazon.' + tld();
    let lastError = null;
    for (const url of [base, base + '/graphql']) {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: headers,
        body: JSON.stringify({ operationName: operationName, query: query, variables: variables })
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (err) { json = null; }
      if (!json) {
        lastError = new Error('Playlist API did not return JSON (' + res.status + ').');
        continue;
      }
      if (json.errors && json.errors.length) {
        lastError = new Error(json.errors[0].message || 'Playlist API error');
        if (res.status === 404) continue;
        throw lastError;
      }
      if (!res.ok) {
        lastError = new Error('Playlist API HTTP ' + res.status);
        continue;
      }
      return json.data || {};
    }
    throw lastError || new Error('Playlist API failed');
  }

  async function appendBatch(playlistId, trackIds) {
    const data = await gql('addTrackToPlaylist', APPEND_MUTATION, {
      id: playlistId,
      trackIds: trackIds,
      rejectDuplicateTracks: true
    });
    const node = data && data.appendTracks;
    if (!node || !node.id) throw new Error('appendTracks did not return a playlist.');
    return node;
  }

  async function appendAll(playlistId, trackIds) {
    let last = null;
    async function run(batch) {
      try {
        last = await appendBatch(playlistId, batch);
        return;
      } catch (err) {
        if (batch.length <= 1) throw err;
        const mid = Math.ceil(batch.length / 2);
        await run(batch.slice(0, mid));
        await run(batch.slice(mid));
      }
    }
    await run(trackIds);
    return last;
  }

  // music.amazon path or absolute URL from createPlaylist; otherwise /playlists/<id> here.
  function playlistPage(created) {
    const raw = created && created.url != null ? String(created.url).trim() : '';
    if (raw.charAt(0) === '/' && raw.charAt(1) !== '/') {
      return new URL(raw, location.origin).href;
    }
    if (raw) {
      try {
        const parsed = new URL(raw);
        const host = parsed.hostname || '';
        if (/^https?:$/i.test(parsed.protocol) && /(^|\.)music\.amazon\./i.test(host)) {
          return parsed.href;
        }
      } catch (err) { /* not a music.amazon absolute URL */ }
    }
    return new URL('/playlists/' + encodeURIComponent(created.id), location.origin).href;
  }

  function setStatus(text, isError) {
    if (!pop) return;
    const el = pop.querySelector('.amhp-status');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('amhp-error', !!isError);
  }

  async function submit(name, count) {
    const gen = ++generation;
    const go = pop.querySelector('.amhp-go');
    if (go) go.disabled = true;
    busy = true;
    try {
      setStatus('Found 0 of ' + count, false);
      const ids = await collectSongs(count, (found, want) => {
        if (gen !== generation) return;
        setStatus('Found ' + found + ' of ' + want, false);
      }, gen);
      if (!ids.length) throw new Error('No songs found in Song History.');
      if (!onHistory()) throw new Error('Left Song History. The playlist was not created.');
      setStatus('Creating playlist\u2026', false);
      const createdData = await gql('PlaylistModalCreatePlaylist', CREATE_MUTATION, {
        title: name,
        visibility: 'PUBLIC',
        trackAsins: null
      });
      const created = createdData && createdData.createPlaylist;
      if (!created || !created.id) throw new Error('Amazon Music did not return a playlist id.');
      setStatus('Adding ' + ids.length + ' songs\u2026', false);
      const appended = await appendAll(created.id, ids);
      const added = appended && typeof appended.trackCount === 'number' ? appended.trackCount : ids.length;
      let msg = 'Added ' + added + ' songs to \u201c' + (created.title || name) + '\u201d.';
      if (ids.length < count) {
        msg += ' Song History ended after ' + ids.length + ' unique songs.';
      }
      setStatus(msg, false);
      // Absolute URL + native form submit: a real document load, not the SPA router.
      const playlistUrl = playlistPage(created);
      const parsed = new URL(playlistUrl, location.origin);
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = parsed.origin + parsed.pathname;
      form.target = '_top';
      parsed.searchParams.forEach((value, key) => {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = key;
        field.value = value;
        form.appendChild(field);
      });
      document.documentElement.appendChild(form);
      form.submit();
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      setStatus(message, true);
    } finally {
      busy = false;
      if (go) go.disabled = false;
    }
  }

  function ensurePop() {
    if (pop) return;
    pop = document.createElement('form');
    pop.className = 'amhp-pop';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Make a playlist from Song History');
    pop.innerHTML = ''
      + '<h2>Playlist from Song History</h2>'
      + '<label class="amhp-field"><span>Playlist name</span><input class="amhp-name" type="text" name="name" autocomplete="off" required></label>'
      + '<label class="amhp-field"><span>How many songs</span><input class="amhp-count" type="text" name="count" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="25" value=""></label>'
      + '<button class="amhp-go" type="submit">Create playlist</button>'
      + '<div class="amhp-status" role="status"></div>';
    pop.addEventListener('submit', (event) => {
      event.preventDefault();
      if (busy) return;
      const nameInput = pop.querySelector('.amhp-name');
      const countInput = pop.querySelector('.amhp-count');
      const name = nameInput ? nameInput.value.replace(/^\s+|\s+$/g, '') : '';
      const countRaw = countInput ? countInput.value.replace(/^\s+|\s+$/g, '') : '';
      if (!name) {
        setStatus('Enter a playlist name.', true);
        return;
      }
      // Do not rewrite the field. Empty (placeholder only) means 25. Anything typed must be a positive whole number.
      let count = 25;
      if (countRaw !== '') {
        if (!/^[1-9]\d*$/.test(countRaw)) {
          setStatus('Enter a positive whole number of songs.', true);
          return;
        }
        count = Number(countRaw);
        if (!Number.isSafeInteger(count) || count < 1) {
          setStatus('Enter a positive whole number of songs.', true);
          return;
        }
      }
      setStatus('', false);
      submit(name, count);
    });
    document.documentElement.appendChild(pop);
  }

  function closePop() {
    if (!pop) return;
    pop.hidden = true;
    if (btn) btn.classList.remove('amhp-open');
  }

  function openPop() {
    ensurePop();
    pop.hidden = false;
    if (btn) btn.classList.add('amhp-open');
    const nameInput = pop.querySelector('.amhp-name');
    if (nameInput) nameInput.focus();
  }

  function ensureButton() {
    if (btn) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'amhp-btn';
    btn.textContent = 'Make playlist';
    btn.setAttribute('aria-label', 'Make a playlist from Song History');
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!onHistory()) return;
      if (pop && !pop.hidden) closePop();
      else openPop();
    });
    document.documentElement.appendChild(btn);
  }

  function removeUi() {
    closePop();
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    btn = null;
  }

  function sync() {
    if (onHistory()) ensureButton();
    else removeUi();
  }

  document.addEventListener('click', (event) => {
    if (!pop || pop.hidden) return;
    const target = event.target;
    if (target && target.closest && target.closest('.amhp-pop, .amhp-btn')) return;
    if (!busy) closePop();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && pop && !pop.hidden && !busy) closePop();
  });

  const pushState = history.pushState;
  const replaceState = history.replaceState;
  history.pushState = function () {
    const result = pushState.apply(this, arguments);
    sync();
    return result;
  };
  history.replaceState = function () {
    const result = replaceState.apply(this, arguments);
    sync();
    return result;
  };
  window.addEventListener('popstate', sync);

  const titleEl = document.querySelector('title');
  if (titleEl && window.MutationObserver) {
    const titleObserver = new MutationObserver(sync);
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
  }
  window.setInterval(sync, 1000);
  sync();
})();
