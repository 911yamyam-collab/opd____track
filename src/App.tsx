import React, { useState } from 'react';
import Navbar, { PageId } from './components/Navbar';
import MatchHeader from './components/MatchHeader';
import PlayerList from './components/PlayerList';
import PlayerProfile from './components/PlayerProfile';
import HistoryPage from './components/HistoryPage';
import PlayersPage from './components/PlayersPage';
import TrueStretchPage from './components/TrueStretchPage';
import SettingsPage from './components/SettingsPage';
import Footer from './components/Footer';
import { useValorant } from './hooks/useValorant';
import { usePlayerDB } from './hooks/usePlayerDB';
import { Player } from './data/types';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('live');
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; isEnemy: boolean } | null>(null);

  const { gameState, match, lastMatch, matchEnded, myInfo, history, loading, error, refresh, lastUpdated, fetchMatchPlayers } = useValorant();
  const { players: dbPlayers, addPlayer, removePlayer, getPlayer } = usePlayerDB();

  const inMatch = gameState === 'INGAME' || gameState === 'PREGAME';

  const renderLivePage = () => {
    if (gameState === 'loading' || loading) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm uppercase tracking-widest opacity-50 font-bold">Connecting...</p>
          </div>
        </div>
      );
    }

    if (gameState === 'NOT_RUNNING' || error) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 border border-primary/30 rounded-lg flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-primary text-3xl">videogame_asset_off</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest">VALORANT Not Running</h2>
            <p className="text-sm opacity-40">Launch VALORANT and start a match to see live data.</p>
            <button
              onClick={refresh}
              className="px-6 py-2 bg-primary/10 border border-primary/30 text-primary text-xs uppercase font-bold tracking-wider rounded hover:bg-primary/20 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // MENUS / DISCONNECTED — show last match data if available, or player info card
    if (gameState === 'MENUS' || gameState === 'DISCONNECTED') {
      // If we have a stale match (just ended), show it with an "ended" overlay
      const displayMatch = lastMatch;

      if (displayMatch) {
        return (
          <>
            {/* Ended banner */}
            <div className="mx-6 md:mx-12 mt-4 flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded text-[10px] uppercase font-bold opacity-60">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Match ended — showing last known data
              <span className="ml-auto opacity-50">
                VALORANT {gameState === 'DISCONNECTED' ? 'Disconnected' : 'In Menus'}
              </span>
            </div>
            <MatchHeader
              mapName={displayMatch.mapName}
              mapImage={displayMatch.mapImage}
              gameMode={displayMatch.gameMode}
              isPregame={false}
            />
            <main className="flex-grow px-4 md:px-8 py-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlayerList
                teamName="Your Team"
                avgRank={displayMatch.myTeamAvgRank}
                players={displayMatch.myTeam}
                onPlayerClick={(player) => setSelectedPlayer({ player, isEnemy: false })}
                dbEntries={dbPlayers}
              />
              <PlayerList
                teamName="Enemy Team"
                avgRank={displayMatch.enemyTeamAvgRank}
                players={displayMatch.enemyTeam}
                isEnemy
                onPlayerClick={(player) => setSelectedPlayer({ player, isEnemy: true })}
                dbEntries={dbPlayers}
              />
            </main>
          </>
        );
      }

      // No last match — show waiting screen with local player info if available
      return (
        <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 border border-accent-cyan/30 rounded-lg flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-accent-cyan text-2xl">sports_esports</span>
            </div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-accent-cyan">Waiting for Match</h2>
            <p className="text-xs opacity-40">Queue up for a game to see live match data.</p>
            <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest opacity-30 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              VALORANT Connected
            </div>
          </div>

          {/* Local player info card */}
          {myInfo && (
            <div className="w-full max-w-sm bg-card-dark border border-border-dark rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-accent-cyan text-xl">person</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">{myInfo.name}</div>
                  <div className="text-[9px] opacity-40 font-mono">{myInfo.tag}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Rank', value: myInfo.rankTier >= 3 ? myInfo.rankName : 'Unranked' },
                  { label: 'RR', value: myInfo.rankTier >= 3 ? String(myInfo.rr) : '—' },
                  { label: 'Games', value: String(myInfo.games) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/50 rounded p-2">
                    <div className="text-[7px] uppercase opacity-40 font-bold">{label}</div>
                    <div className="text-xs font-mono font-bold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              {myInfo.history.length > 0 && (
                <div className="flex gap-1 justify-center">
                  {myInfo.history.slice(0, 5).map((h, i) => (
                    <div key={i} className={`w-7 h-7 rounded flex flex-col items-center justify-center text-[7px] font-bold border ${
                      h.result === 'win'
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-primary/20 border-primary/30 text-primary'
                    }`}>
                      <span>{h.result === 'win' ? 'W' : 'L'}</span>
                      <span className="opacity-70">{h.result === 'win' ? '+' : '-'}{h.rrChange}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (inMatch && !match) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm uppercase tracking-widest opacity-50 font-bold">
              {gameState === 'PREGAME' ? 'Loading Agent Select...' : 'Loading Match Data...'}
            </p>
          </div>
        </div>
      );
    }

    if (inMatch && match) {
      return (
        <>
          <MatchHeader
            mapName={match.mapName}
            mapImage={match.mapImage}
            gameMode={match.gameMode}
            isPregame={match.isPregame}
          />
          <main className="flex-grow px-4 md:px-8 py-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlayerList
              teamName="Your Team"
              avgRank={match.myTeamAvgRank}
              players={match.myTeam}
              onPlayerClick={(player) => setSelectedPlayer({ player, isEnemy: false })}
              dbEntries={dbPlayers}
            />
            <PlayerList
              teamName="Enemy Team"
              avgRank={match.enemyTeamAvgRank}
              players={match.enemyTeam}
              isEnemy
              onPlayerClick={(player) => setSelectedPlayer({ player, isEnemy: true })}
              dbEntries={dbPlayers}
            />
          </main>
          {lastUpdated > 0 && (
            <div className="px-12 pb-1 text-[8px] opacity-15 font-mono uppercase">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </>
      );
    }

    return null;
  };

  const renderPage = () => {
    switch (activePage) {
      case 'live': return renderLivePage();
      case 'history':
        return (
          <HistoryPage
            matches={history}
            fetchMatchPlayers={fetchMatchPlayers}
            dbEntries={dbPlayers}
            onAddToDB={addPlayer}
            onRemoveFromDB={removePlayer}
          />
        );
      case 'players':
        return <PlayersPage players={dbPlayers} onRemove={removePlayer} />;
      case 'stretch': return <TrueStretchPage />;
      case 'settings': return <SettingsPage />;
      default: return null;
    }
  };

  // Current match context for profile modal
  const currentMatchContext = match || lastMatch;

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} gameState={gameState} />
      {renderPage()}
      <Footer />

      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer.player}
          isEnemy={selectedPlayer.isEnemy}
          mapName={currentMatchContext?.mapName}
          mapImage={currentMatchContext?.mapImage}
          matchId={undefined}
          existingEntry={getPlayer(selectedPlayer.player.puuid)}
          onClose={() => setSelectedPlayer(null)}
          onAddToDB={addPlayer}
          onRemoveFromDB={removePlayer}
        />
      )}
    </>
  );
}
