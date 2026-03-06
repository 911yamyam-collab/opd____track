'use strict';

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Disable SSL verification for all requests (Riot uses self-signed certs locally)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const axiosInstance = axios.create({ httpsAgent });

// ─── Cache ────────────────────────────────────────────────────────────────────
let authCache = null;          // { headers, puuid, pdUrl, glzUrl, region }
let contentCache = null;       // { agents, mapUrls, seasons, timestamp }
const CONTENT_TTL = 60 * 60 * 1000; // 1 hour

// ─── Concurrency limiter ──────────────────────────────────────────────────────
async function batchedPromises(items, fn, concurrency = 3) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    // allSettled so one failure never kills the whole batch
    const settled = await Promise.allSettled(batch.map(fn));
    results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : null));
  }
  return results;
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────
const TIER_NAMES = [
  'Unranked','Unranked','Unranked',
  'Iron 1','Iron 2','Iron 3',
  'Bronze 1','Bronze 2','Bronze 3',
  'Silver 1','Silver 2','Silver 3',
  'Gold 1','Gold 2','Gold 3',
  'Platinum 1','Platinum 2','Platinum 3',
  'Diamond 1','Diamond 2','Diamond 3',
  'Ascendant 1','Ascendant 2','Ascendant 3',
  'Immortal 1','Immortal 2','Immortal 3',
  'Radiant',
];

function tierName(tier) {
  return TIER_NAMES[tier] || 'Unranked';
}

// Before-ascendant seasons (rank tier adjustment needed)
const BEFORE_ASCENDANT = new Set([
  '0df5adb9-4dcb-6899-1306-3e9860661dd3','3f61c772-4560-cd3f-5d3f-a7ab5abda6b3',
  '0530b9c4-4980-f2ee-df5d-09864cd00542','46ea6166-4573-1128-9cea-60a15640059b',
  'fcf2c8f4-4324-e50b-2e23-718e4a3ab046','97b6e739-44cc-ffa7-49ad-398ba502ceb0',
  'ab57ef51-4e59-da91-cc8d-51a5a2b9b8ff','52e9749a-429b-7060-99fe-4595426a0cf7',
  '71c81c67-4fae-ceb1-844c-aab2bb8710fa','2a27e5d2-4d30-c9e2-b15a-93b8909a442c',
  '4cb622e1-4244-6da3-7276-8daaf1c01be2','a16955a5-4ad0-f761-5e9e-389df1c892fb',
  '97b39124-46ce-8b55-8fd1-7cbf7ffe173f','573f53ac-41a5-3a7d-d9ce-d6a6298e5704',
  'd929bc38-4ab6-7da4-94f0-ee84f8ac141e','3e47230a-463c-a301-eb7d-67bb60357d4f',
  '808202d6-4f2b-a8ff-1feb-b3a0590ad79f',
]);

// Socket UUIDs for weapon loadouts
const SKIN_SOCKET = 'bcef87d6-209b-46c6-8b19-fbe40bd95abc';

// ─── Lockfile ─────────────────────────────────────────────────────────────────
function getLockfile() {
  const lockfilePath = path.join(
    process.env.LOCALAPPDATA,
    'Riot Games', 'Riot Client', 'Config', 'lockfile'
  );
  if (!fs.existsSync(lockfilePath)) return null;
  const data = fs.readFileSync(lockfilePath, 'utf8');
  const [name, PID, port, password, protocol] = data.split(':');
  return { name, PID, port: port.trim(), password: password.trim(), protocol: protocol ? protocol.trim() : 'https' };
}

// ─── Region & Version from VALORANT log ──────────────────────────────────────
function getRegionAndVersion() {
  const logPath = path.join(
    process.env.LOCALAPPDATA,
    'VALORANT', 'Saved', 'Logs', 'ShooterGame.log'
  );
  if (!fs.existsSync(logPath)) return null;

  let pdRegion = null;
  let glzRegion = null;
  let version = null;

  try {
    // Read last 500KB of log file for performance
    const stats = fs.statSync(logPath);
    const readSize = Math.min(stats.size, 500 * 1024);
    const start = Math.max(0, stats.size - readSize);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(logPath, 'r');
    fs.readSync(fd, buf, 0, readSize, start);
    fs.closeSync(fd);
    const content = buf.toString('utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (!pdRegion && line.includes('.a.pvp.net/account-xp/v1/')) {
        const parts = line.split('.a.pvp.net/account-xp/v1/')[0].split('.');
        pdRegion = parts[parts.length - 1];
      }
      if (!glzRegion && line.includes('https://glz-')) {
        const after = line.split('https://glz-')[1];
        if (after) {
          const sub1 = after.split('.')[0];
          const sub2 = after.split('.')[1];
          if (sub1 && sub2) glzRegion = [sub1, sub2];
        }
      }
      if (!version && line.includes('CI server version:')) {
        const raw = line.split('CI server version: ')[1];
        if (raw) {
          const v = raw.trim().split('-');
          v.splice(2, 0, 'shipping');
          version = v.join('-');
        }
      }
      if (pdRegion && glzRegion && version) break;
    }
  } catch (e) {
    // ignore
  }

  if (!pdRegion || !glzRegion) return null;
  return { pdRegion, glzRegion, version: version || 'release-09.00-shipping-15-2616058' };
}

// ─── Auth headers ─────────────────────────────────────────────────────────────
async function getAuthHeaders(forceRefresh = false) {
  if (authCache && !forceRefresh) return authCache;

  const lockfile = getLockfile();
  if (!lockfile) return null;

  const localAuth = 'Basic ' + Buffer.from(`riot:${lockfile.password}`).toString('base64');
  const localHeaders = { Authorization: localAuth };

  let entitlements;
  try {
    const res = await axiosInstance.get(
      `https://127.0.0.1:${lockfile.port}/entitlements/v1/token`,
      { headers: localHeaders, timeout: 5000 }
    );
    entitlements = res.data;
  } catch (e) {
    return null;
  }

  if (!entitlements || !entitlements.accessToken) return null;
  if (entitlements.message === 'Entitlements token is not ready yet') return null;

  const regionInfo = getRegionAndVersion();
  if (!regionInfo) return null;

  const { pdRegion, glzRegion, version } = regionInfo;
  const pdUrl = `https://pd.${pdRegion}.a.pvp.net`;
  const glzUrl = `https://glz-${glzRegion[0]}.${glzRegion[1]}.a.pvp.net`;
  const sharedUrl = `https://shared.${pdRegion}.a.pvp.net`;

  const headers = {
    'Authorization': `Bearer ${entitlements.accessToken}`,
    'X-Riot-Entitlements-JWT': entitlements.token,
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': version,
    'User-Agent': 'ShooterGame/13 Windows/10.0.19043.1.256.64bit',
  };

  authCache = {
    headers,
    localHeaders,
    lockfile,
    puuid: entitlements.subject,
    pdUrl,
    glzUrl,
    sharedUrl,
    region: pdRegion,
  };

  return authCache;
}

// ─── API fetch helpers ────────────────────────────────────────────────────────
async function pdFetch(endpoint, method = 'get', body = null) {
  const auth = await getAuthHeaders();
  if (!auth) return null;
  try {
    const config = { headers: auth.headers, timeout: 10000 };
    if (body) config.data = body;
    const res = await axiosInstance.request({ method, url: auth.pdUrl + endpoint, ...config });
    if (res.data?.errorCode === 'BAD_CLAIMS') {
      authCache = null;
      const auth2 = await getAuthHeaders(true);
      if (!auth2) return null;
      const res2 = await axiosInstance.request({ method, url: auth2.pdUrl + endpoint, headers: auth2.headers, timeout: 10000 });
      return res2.data;
    }
    return res.data;
  } catch (e) {
    if (e.response?.data?.errorCode === 'BAD_CLAIMS') {
      authCache = null;
    }
    return null;
  }
}

async function glzFetch(endpoint, method = 'get') {
  const auth = await getAuthHeaders();
  if (!auth) return null;
  try {
    const res = await axiosInstance.request({ method, url: auth.glzUrl + endpoint, headers: auth.headers, timeout: 10000 });
    if (res.data?.errorCode === 'BAD_CLAIMS') {
      authCache = null;
      const auth2 = await getAuthHeaders(true);
      if (!auth2) return null;
      const res2 = await axiosInstance.request({ method, url: auth2.glzUrl + endpoint, headers: auth2.headers, timeout: 10000 });
      return res2.data;
    }
    return res.data;
  } catch (e) {
    return null;
  }
}

async function localFetch(endpoint, method = 'get') {
  const auth = await getAuthHeaders();
  if (!auth) return null;
  try {
    const res = await axiosInstance.request({
      method,
      url: `https://127.0.0.1:${auth.lockfile.port}${endpoint}`,
      headers: auth.localHeaders,
      timeout: 5000,
    });
    return res.data;
  } catch (e) {
    return null;
  }
}

// ─── Content (agents, maps, seasons) ─────────────────────────────────────────
async function getContent() {
  const now = Date.now();
  if (contentCache && now - contentCache.timestamp < CONTENT_TTL) return contentCache;

  try {
    const [agentsRes, mapsRes, weaponsRes] = await Promise.all([
      axios.get('https://valorant-api.com/v1/agents?isPlayableCharacter=true', { timeout: 10000 }),
      axios.get('https://valorant-api.com/v1/maps', { timeout: 10000 }),
      axios.get('https://valorant-api.com/v1/weapons', { timeout: 10000 }),
    ]);

    const agents = {};
    for (const a of agentsRes.data.data) {
      agents[a.uuid.toLowerCase()] = {
        name: a.displayName,
        iconUrl: a.displayIcon,
      };
    }

    const mapUrls = {};
    const mapImages = {};
    for (const m of mapsRes.data.data) {
      if (m.mapUrl) {
        mapUrls[m.mapUrl.toLowerCase()] = m.displayName;
        mapImages[m.displayName] = m.stylizedBackgroundImage || m.splash || m.listViewIconTall || m.listViewIcon || null;
      }
    }
    const weaponSkins = {};
    const weaponNames = {};
    const weaponIcons = {}; // weapon UUID -> default display icon
    for (const w of weaponsRes.data.data) {
      const wid = w.uuid.toLowerCase();
      weaponNames[wid] = w.displayName;
      weaponIcons[wid] = w.displayIcon || null;
      if (w.skins) {
        for (const skin of w.skins) {
          // Use weapon's own displayIcon as fallback when skin has no icon
          const fallbackIcon = w.displayIcon || null;
          if (skin.uuid) {
            weaponSkins[skin.uuid.toLowerCase()] = {
              name: skin.displayName,
              iconUrl: skin.levels?.[0]?.displayIcon || fallbackIcon,
            };
          }
          if (skin.levels) {
            for (const level of skin.levels) {
              if (level.uuid) {
                weaponSkins[level.uuid.toLowerCase()] = {
                  name: skin.displayName,
                  iconUrl: level.displayIcon || skin.levels?.[0]?.displayIcon || fallbackIcon,
                };
              }
            }
          }
        }
      }
    }

    contentCache = { agents, mapUrls, mapImages, weaponSkins, weaponNames, weaponIcons, timestamp: now };
    return contentCache;
  } catch (e) {
    return contentCache || { agents: {}, mapUrls: {}, weaponSkins: {}, weaponNames: {}, timestamp: now };
  }
}

// ─── Get current season ───────────────────────────────────────────────────────
async function getCurrentSeason() {
  const auth = await getAuthHeaders();
  if (!auth) return null;
  try {
    const res = await axiosInstance.get(
      `https://shared.${auth.region}.a.pvp.net/content-service/v3/content`,
      { headers: auth.headers, timeout: 10000 }
    );
    const seasons = res.data?.Seasons || [];
    for (const s of seasons) {
      if (s.IsActive && s.Type === 'act') return s.ID;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// ─── Get player rank ─────────────────────────────────────────────────────────
async function getPlayerRank(puuid, seasonId) {
  const data = await pdFetch(`/mmr/v1/players/${puuid}`, 'get');
  if (!data) return { rankTier: 0, rr: 0, leaderboard: 0, peakRankTier: 0, wr: 'N/A', games: 0 };

  let rankTier = 0, rr = 0, leaderboard = 0, peakRankTier = 0, wr = 'N/A', games = 0;

  try {
    const allSeasons = data?.QueueSkills?.competitive?.SeasonalInfoBySeasonID || {};

    // PRIMARY: LatestCompetitiveUpdate gives most-accurate current rank/RR
    const latest = data.LatestCompetitiveUpdate;
    if (latest?.TierAfterUpdate >= 3) {
      rankTier = latest.TierAfterUpdate;
      rr = latest.RankedRatingAfterUpdate ?? 0;
    }

    // Seasonal data for games/WR/leaderboard + rank fallback
    const seasonData = seasonId ? allSeasons[seasonId] : null;
    if (seasonData) {
      games = seasonData.NumberOfGames || 0;
      const wins = seasonData.NumberOfWinsWithPlacements || 0;
      wr = games > 0 ? Math.round((wins / games) * 100) : 0;
      leaderboard = seasonData.LeaderboardRank || 0;
      // Use seasonal rank only as fallback if LatestCompetitiveUpdate was missing
      if (rankTier === 0) {
        const tier = parseInt(seasonData.CompetitiveTier || 0);
        rankTier = tier >= 3 ? tier : 0;
        rr = seasonData.RankedRating || 0;
      }
    }

    // If still no rank, scan all seasons for most recent one with rank data
    if (rankTier === 0) {
      for (const [, sdata] of Object.entries(allSeasons).reverse()) {
        const t = parseInt(sdata.CompetitiveTier || 0);
        if (t >= 3) {
          rankTier = t;
          rr = sdata.RankedRating || 0;
          if (!games) {
            games = sdata.NumberOfGames || 0;
            const wins = sdata.NumberOfWinsWithPlacements || 0;
            wr = games > 0 ? Math.round((wins / games) * 100) : 0;
          }
          break;
        }
      }
    }

    // Peak rank across all seasons
    let maxRank = rankTier;
    for (const [sid, sdata] of Object.entries(allSeasons)) {
      const wbt = sdata.WinsByTier;
      if (wbt) {
        for (let t of Object.keys(wbt)) {
          let tInt = parseInt(t);
          if (BEFORE_ASCENDANT.has(sid) && tInt > 20) tInt += 3;
          if (tInt > maxRank) maxRank = tInt;
        }
      }
    }
    peakRankTier = maxRank;
  } catch (e) {
    // ignore
  }

  return { rankTier, rr, leaderboard, peakRankTier, wr, games };
}

// ─── Get last N competitive updates ──────────────────────────────────────────
async function getCompetitiveHistory(puuid, count = 5) {
  const data = await pdFetch(
    `/mmr/v1/players/${puuid}/competitiveupdates?startIndex=0&endIndex=${count}&queue=competitive`,
    'get'
  );
  if (!data?.Matches) return [];
  return data.Matches.map(m => ({
    result: m.RankedRatingEarned >= 0 ? 'win' : 'loss',
    rrChange: Math.abs(m.RankedRatingEarned),
    matchId: m.MatchID,
  }));
}

// ─── Get player names ─────────────────────────────────────────────────────────
async function getPlayerNames(puuids) {
  const auth = await getAuthHeaders();
  if (!auth) return {};
  try {
    const res = await axiosInstance.put(
      `${auth.pdUrl}/name-service/v2/players`,
      puuids,
      { headers: auth.headers, timeout: 10000 }
    );
    const result = {};
    for (const p of (res.data || [])) {
      result[p.Subject] = { name: p.GameName, tag: `#${p.TagLine}` };
    }
    return result;
  } catch (e) {
    return {};
  }
}

// ─── Game state from presences ────────────────────────────────────────────────
async function getGameState() {
  const auth = await getAuthHeaders();
  if (!auth) return { state: 'NOT_RUNNING', queueId: '' };

  const presences = await localFetch('/chat/v4/presences', 'get');
  if (!presences?.presences) return { state: 'MENUS', queueId: '' };

  for (const p of presences.presences) {
    if (p.puuid !== auth.puuid) continue;
    if (!p.private || p.private === '') continue;
    // Skip non-valorant products
    if (p.product === 'league_of_legends' || p.championId != null) continue;

    try {
      const decoded = JSON.parse(Buffer.from(p.private, 'base64').toString('utf8'));
      let state, queueId;
      if (decoded.matchPresenceData) {
        state = decoded.matchPresenceData.sessionLoopState;
        queueId = decoded.queueId || '';
      } else if (decoded.sessionLoopState) {
        state = decoded.sessionLoopState;
        queueId = decoded.queueId || '';
      } else {
        continue;
      }
      return { state, queueId };
    } catch (e) {
      // ignore decode errors
    }
  }

  return { state: 'MENUS', queueId: '' };
}

// ─── Get loadouts ─────────────────────────────────────────────────────────────
async function getLoadouts(matchId, isPregame) {
  const endpoint = isPregame
    ? `/pregame/v1/matches/${matchId}/loadouts`
    : `/core-game/v1/matches/${matchId}/loadouts`;
  return await glzFetch(endpoint, 'get');
}

function extractSkins(loadoutData, content) {
  // Build a dynamic map: weapon UUID (lowercase) -> slot key
  // This avoids hardcoded UUIDs by resolving names from the content API
  const NAME_TO_KEY = { phantom: 'phantom', vandal: 'vandal', operator: 'operator', melee: 'melee' };
  // Fallback hardcoded UUIDs in case content isn't loaded yet
  const FALLBACK_IDS = {
    '9c82e19d-4575-0200-1a81-3eacf00cf872': 'phantom',
    'ee8369b5-4395-2e9e-4db0-c7a27a1e6e90': 'vandal',
    'a8c5df50-4f50-cbae-5b77-01a3b3fe7b66': 'operator',
    '2f59173c-4bed-b6c3-2191-dea9b58be9c7': 'melee',
  };

  const uuidToKey = { ...FALLBACK_IDS };
  for (const [uuid, name] of Object.entries(content.weaponNames || {})) {
    const lname = (name || '').toLowerCase();
    if (NAME_TO_KEY[lname]) uuidToKey[uuid.toLowerCase()] = NAME_TO_KEY[lname];
  }

  const result = {};
  const loadouts = loadoutData?.Loadouts || loadoutData?.PreGameLoadouts || [];

  for (const playerLoadout of loadouts) {
    const puuid = playerLoadout.Subject;
    const rawItems = playerLoadout.Loadout?.Items || {};
    const skins = { phantom: null, vandal: null, operator: null, melee: null };

    // Normalize all item keys to lowercase for reliable lookup
    for (const [rawKey, item] of Object.entries(rawItems)) {
      const lkey = rawKey.toLowerCase();
      const weaponKey = uuidToKey[lkey];
      if (!weaponKey) continue;

      // Try multiple socket key formats (Riot API casing can vary)
      const skinSocket = item.Sockets?.[SKIN_SOCKET]
        || item.Sockets?.[SKIN_SOCKET.toUpperCase()]
        || Object.values(item.Sockets || {}).find(s => s?.Item?.TypeID?.toLowerCase().includes('skin'));
      const skinUuid = skinSocket?.Item?.ID?.toLowerCase();

      if (skinUuid && content.weaponSkins?.[skinUuid]) {
        const entry = content.weaponSkins[skinUuid];
        // Use weapon's own displayIcon as fallback when skin has no rendered icon
        skins[weaponKey] = {
          name: entry.name,
          iconUrl: entry.iconUrl || content.weaponIcons?.[lkey] || null,
        };
      } else {
        // No skin data — fall back to weapon's default icon so the slot still shows something
        skins[weaponKey] = {
          name: weaponKey.charAt(0).toUpperCase() + weaponKey.slice(1),
          iconUrl: content.weaponIcons?.[lkey] || null,
        };
      }
    }

    result[puuid] = skins;
  }

  return result;
}

// ─── Format time ago ─────────────────────────────────────────────────────────
function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'just now';
}

// ─── Average rank helper ──────────────────────────────────────────────────────
function avgRank(players) {
  const ranked = players.filter(p => p.rankTier >= 3);
  if (!ranked.length) return 'Unranked';
  const avg = Math.round(ranked.reduce((s, p) => s + p.rankTier, 0) / ranked.length);
  return tierName(avg);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Status check
app.get('/api/status', async (req, res) => {
  const lockfile = getLockfile();
  if (!lockfile) {
    return res.json({ running: false, gameState: 'NOT_RUNNING', queueId: '' });
  }

  try {
    const gameState = await getGameState();
    return res.json({ running: true, gameState: gameState.state, queueId: gameState.queueId });
  } catch (e) {
    return res.json({ running: false, gameState: 'NOT_RUNNING', queueId: '' });
  }
});

// Live match data
app.get('/api/live-match', async (req, res) => {
  try {
    const auth = await getAuthHeaders();
    if (!auth) return res.status(503).json({ error: 'Not authenticated' });

    const content = await getContent();
    const seasonId = await getCurrentSeason();

    // Try pregame first, then coregame
    let matchData = null;
    let isPregame = false;
    let matchId = null;

    const pregamePlayer = await glzFetch(`/pregame/v1/players/${auth.puuid}`, 'get');
    if (pregamePlayer?.MatchID && !pregamePlayer.errorCode) {
      matchId = pregamePlayer.MatchID;
      matchData = await glzFetch(`/pregame/v1/matches/${matchId}`, 'get');
      isPregame = true;
    }

    if (!matchData || matchData.errorCode) {
      const coregamePlayer = await glzFetch(`/core-game/v1/players/${auth.puuid}`, 'get');
      if (coregamePlayer?.MatchID && !coregamePlayer.errorCode) {
        matchId = coregamePlayer.MatchID;
        matchData = await glzFetch(`/core-game/v1/matches/${matchId}`, 'get');
        isPregame = false;
      }
    }

    if (!matchData || matchData.errorCode) {
      return res.status(404).json({ error: 'Not in match' });
    }

    // Identify teams
    const allPlayers = isPregame
      ? matchData.AllyTeam?.Players || []
      : matchData.Players || [];

    // For pregame, all players are ally team; enemy not available
    let allyPlayers = [], enemyPlayers = [];

    if (isPregame) {
      allyPlayers = allPlayers;
      enemyPlayers = [];
    } else {
      // Find local player's team
      const localPlayer = allPlayers.find(p => p.Subject === auth.puuid);
      const myTeamId = localPlayer?.TeamID;
      allyPlayers = allPlayers.filter(p => p.TeamID === myTeamId);
      enemyPlayers = allPlayers.filter(p => p.TeamID !== myTeamId);
    }

    const allPuuids = allPlayers.map(p => p.Subject);

    // Get names first, then batch ranks and history with concurrency limit
    const names = await getPlayerNames(allPuuids);

    const rankResults = await batchedPromises(allPuuids, puuid => getPlayerRank(puuid, seasonId), 3);
    const rankMap = {};
    allPuuids.forEach((puuid, i) => { rankMap[puuid] = rankResults[i]; });

    const historyResults = await batchedPromises(allPuuids, puuid => getCompetitiveHistory(puuid, 5), 3);
    const historyMap = {};
    allPuuids.forEach((puuid, i) => { historyMap[puuid] = historyResults[i]; });

    // Get loadouts — try both endpoints; pregame gives full armory, coregame gives current round
    let loadoutMap = {};
    if (matchId) {
      try {
        const loadoutData = await getLoadouts(matchId, isPregame);
        if (loadoutData) loadoutMap = extractSkins(loadoutData, content);
      } catch (e) { /* skip */ }
      // If coregame loadout was empty, also try the other endpoint
      if (!isPregame && Object.keys(loadoutMap).length === 0) {
        try {
          const loadoutData = await getLoadouts(matchId, true);
          if (loadoutData) loadoutMap = extractSkins(loadoutData, content);
        } catch (e) { /* skip */ }
      }
    }

    // Get map name
    const mapId = matchData.MapID?.toLowerCase() || '';
    const mapName = content.mapUrls[mapId] || 'Unknown Map';
    const mapImage = content.mapImages?.[mapName] || null;

    // Format players
    function formatPlayer(p) {
      const puuid = p.Subject;
      const nameInfo = names[puuid] || { name: 'Unknown', tag: '#0000' };
      const rank = rankMap[puuid] || { rankTier: 0, rr: 0, peakRankTier: 0, wr: 0, games: 0 };
      const agentUuid = (p.CharacterID || '').toLowerCase();
      const agentInfo = content.agents[agentUuid] || { name: 'TBD', iconUrl: null };
      const identity = p.PlayerIdentity || {};
      const skins = loadoutMap[puuid] || null;

      return {
        puuid,
        name: nameInfo.name,
        tag: nameInfo.tag,
        agentName: agentInfo.name,
        agentIconUrl: agentInfo.iconUrl,
        rankTier: rank.rankTier,
        rankName: tierName(rank.rankTier),
        rr: rank.rr,
        leaderboard: rank.leaderboard,
        peakRankTier: rank.peakRankTier,
        peakRankName: tierName(rank.peakRankTier),
        wr: rank.wr,
        games: rank.games,
        accountLevel: identity.AccountLevel || 0,
        incognito: identity.Incognito || false,
        history: historyMap[puuid] || [],
        skins,
        isLocal: puuid === auth.puuid,
        teamId: p.TeamID || 'Ally',
      };
    }

    const myTeam = allyPlayers.map(formatPlayer);
    const enemyTeam = enemyPlayers.map(formatPlayer);

    return res.json({
      mapName,
      mapImage,
      gameMode: 'Competitive',
      isPregame,
      myTeam,
      enemyTeam,
      myTeamAvgRank: avgRank(myTeam),
      enemyTeamAvgRank: avgRank(enemyTeam),
    });

  } catch (e) {
    console.error('live-match error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Match history for local player
app.get('/api/history', async (req, res) => {
  try {
    const auth = await getAuthHeaders();
    if (!auth) return res.status(503).json({ error: 'Not authenticated' });

    const content = await getContent();

    // Get last 15 competitive updates
    const updatesData = await pdFetch(
      `/mmr/v1/players/${auth.puuid}/competitiveupdates?startIndex=0&endIndex=15&queue=competitive`,
      'get'
    );

    if (!updatesData?.Matches?.length) {
      return res.json({ matches: [] });
    }

    // Fetch match details with concurrency limit to avoid rate limits
    const matchesToFetch = updatesData.Matches.slice(0, 10);
    const matchDetails = await batchedPromises(
      matchesToFetch,
      async (m) => {
        try {
          const detail = await pdFetch(`/match-details/v1/matches/${m.MatchID}`, 'get');
          return { status: 'fulfilled', value: { update: m, detail } };
        } catch (e) {
          return { status: 'rejected' };
        }
      },
      3
    );

    const matches = [];
    for (const r of matchDetails) {
      if (r.status !== 'fulfilled') continue;
      const { update, detail } = r.value;
      if (!detail) continue;

      try {
        const mapId = detail.matchInfo?.mapId?.toLowerCase() || '';
        const mapName = content.mapUrls[mapId] || 'Unknown Map';
        const mapImg = content.mapImages?.[mapName] || null;
        const queue = detail.matchInfo?.queueID || 'competitive';

        // Find local player stats
        const playerEntry = detail.players?.find(p => p.subject === auth.puuid);
        if (!playerEntry) continue;

        const kills = playerEntry.stats?.kills || 0;
        const deaths = playerEntry.stats?.deaths || 0;
        const assists = playerEntry.stats?.assists || 0;

        // Get agent info
        const agentUuid = (playerEntry.characterId || '').toLowerCase();
        const agentInfo = content.agents[agentUuid] || { name: 'Unknown', iconUrl: null };

        // Find team result
        const myTeam = playerEntry.teamId;
        const teams = detail.teams || [];
        const myTeamData = teams.find(t => t.teamId === myTeam);
        const won = myTeamData?.won === true;

        // Score
        const myRounds = myTeamData?.roundsWon || 0;
        const enemyTeamData = teams.find(t => t.teamId !== myTeam);
        const enemyRounds = enemyTeamData?.roundsWon || 0;

        // RR
        const rrChange = update.RankedRatingEarned || 0;
        const startTime = detail.matchInfo?.gameStartMillis || Date.now();

        matches.push({
          matchId: update.MatchID,
          mapName,
          mapImage: mapImg,
          gameMode: queue.charAt(0).toUpperCase() + queue.slice(1),
          result: won ? 'win' : 'loss',
          score: `${myRounds}-${enemyRounds}`,
          agentName: agentInfo.name,
          agentIconUrl: agentInfo.iconUrl,
          kills,
          deaths,
          assists,
          rrChange,
          time: timeAgo(startTime),
        });
      } catch (e) {
        // skip bad match
      }
    }

    return res.json({ matches });
  } catch (e) {
    console.error('history error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Current player info (for MENUS state)
app.get('/api/me', async (req, res) => {
  try {
    const auth = await getAuthHeaders();
    if (!auth) return res.status(503).json({ error: 'Not authenticated' });

    const seasonId = await getCurrentSeason();
    const [names, rank, history] = await Promise.all([
      getPlayerNames([auth.puuid]),
      getPlayerRank(auth.puuid, seasonId),
      getCompetitiveHistory(auth.puuid, 5),
    ]);

    const nameInfo = names[auth.puuid] || { name: 'Unknown', tag: '#0000' };

    return res.json({
      puuid: auth.puuid,
      name: nameInfo.name,
      tag: nameInfo.tag,
      agentName: '',
      agentIconUrl: null,
      rankTier: rank.rankTier,
      rankName: tierName(rank.rankTier),
      rr: rank.rr,
      leaderboard: rank.leaderboard,
      peakRankTier: rank.peakRankTier,
      peakRankName: tierName(rank.peakRankTier),
      wr: rank.wr,
      games: rank.games,
      accountLevel: 0,
      incognito: false,
      history,
      skins: null,
      isLocal: true,
      teamId: '',
    });
  } catch (e) {
    console.error('me error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Full player list for a past match (from match history)
app.get('/api/match/:matchId/players', async (req, res) => {
  const { matchId } = req.params;
  try {
    const auth = await getAuthHeaders();
    if (!auth) return res.status(503).json({ error: 'Not authenticated' });

    const content = await getContent();
    const detail = await pdFetch(`/match-details/v1/matches/${matchId}`, 'get');
    if (!detail) return res.status(404).json({ error: 'Match not found' });

    const mapId = detail.matchInfo?.mapId?.toLowerCase() || '';
    const mapName = content.mapUrls[mapId] || 'Unknown Map';
    const mapImage = content.mapImages?.[mapName] || null;
    const queue = detail.matchInfo?.queueID || 'competitive';

    const localPlayerEntry = detail.players?.find(p => p.subject === auth.puuid);
    const myTeamId = localPlayerEntry?.teamId || 'Red';

    const myTeam = [];
    const enemyTeam = [];

    for (const p of (detail.players || [])) {
      const puuid = p.subject;
      const agentUuid = (p.characterId || '').toLowerCase();
      const agentInfo = content.agents[agentUuid] || { name: 'Unknown', iconUrl: null };
      const rankTier = p.competitiveTier || 0;

      const playerObj = {
        puuid,
        name: p.gameName || 'Unknown',
        tag: p.tagLine ? `#${p.tagLine}` : '#0000',
        agentName: agentInfo.name,
        agentIconUrl: agentInfo.iconUrl,
        rankTier: rankTier >= 3 ? rankTier : 0,
        rankName: tierName(rankTier),
        rr: p.rankedRating || 0,
        leaderboard: 0,
        peakRankTier: 0,
        peakRankName: '',
        wr: 'N/A',
        games: 0,
        accountLevel: p.accountLevel || 0,
        incognito: p.isIncognito || false,
        history: [],
        skins: null,
        isLocal: puuid === auth.puuid,
        teamId: p.teamId || '',
        kills: p.stats?.kills || 0,
        deaths: p.stats?.deaths || 0,
        assists: p.stats?.assists || 0,
      };

      if (p.teamId === myTeamId) {
        myTeam.push(playerObj);
      } else {
        enemyTeam.push(playerObj);
      }
    }

    return res.json({
      mapName,
      mapImage,
      gameMode: queue.charAt(0).toUpperCase() + queue.slice(1),
      isPregame: false,
      myTeam,
      enemyTeam,
      myTeamAvgRank: avgRank(myTeam),
      enemyTeamAvgRank: avgRank(enemyTeam),
    });
  } catch (e) {
    console.error('match players error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[traopd1] API server running on http://127.0.0.1:${PORT}`);
  });
} else {
  // When required by electron, also listen
  // Wait, electron/main.js expects it to be running.
  // In electron/main.js: serverInstance = require('../server/valorant');
  // Let's check how electron/main.js handles it.
  const PORT = 3001;
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[traopd1] API server running on http://127.0.0.1:${PORT}`);
  }).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`[traopd1] Port ${PORT} already in use, assuming server is already running.`);
    }
  });
}

module.exports = app;
