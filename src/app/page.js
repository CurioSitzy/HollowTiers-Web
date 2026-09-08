'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Komponen Badge Region
function RegionBadge({ region }) {
  const getRegionColor = (reg) => {
    switch (reg?.toUpperCase()) {
      case 'NA':
        return 'bg-red-950/80 text-red-400 border-red-800/50';
      case 'EU':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/50';
      case 'AS':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/50';
      case 'AU':
        return 'bg-green-950/80 text-green-400 border-green-800/50';
      case 'SA':
        return 'bg-purple-950/80 text-purple-400 border-purple-800/50';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black border tracking-wider ${getRegionColor(
        region
      )}`}
    >
      {region ? region.toUpperCase() : 'N/A'}
    </span>
  );
}

// Komponen Badge Tier Berwarna (HT1 - LT5)
function TierBadge({ tier }) {
  if (!tier) return <span className="text-zinc-600 font-bold">-</span>;

  const getTierStyle = (t) => {
    const formattedTier = t.toUpperCase().trim();

    switch (formattedTier) {
      case 'HT1':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'LT1':
        return 'bg-amber-950/90 text-amber-300 border-amber-600/80 font-extrabold';
      case 'HT2':
        return 'bg-purple-900/90 text-purple-200 border-purple-500 font-extrabold shadow-[0_0_8px_rgba(168,85,247,0.4)]';
      case 'LT2':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/70 font-bold';
      case 'HT3':
        return 'bg-red-900/90 text-red-200 border-red-500 font-bold';
      case 'LT3':
        return 'bg-red-950/80 text-red-300 border-red-800/70 font-bold';
      case 'HT4':
      case 'TIER 4':
        return 'bg-blue-900/80 text-blue-200 border-blue-500 font-semibold';
      case 'LT4':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/70 font-semibold';
      case 'HT5':
      case 'TIER 5':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70 font-medium';
      case 'LT5':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700 font-medium';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] border tracking-wide uppercase transition-all ${getTierStyle(
        tier
      )}`}
    >
      {tier}
    </span>
  );
}

// Modal Pop-up Player Card
function PlayerModal({ player, gamemodes, onClose }) {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full w-8 h-8 flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative w-20 h-20 rounded-2xl p-1 bg-gradient-to-b from-red-600 to-red-950 shadow-[0_0_25px_rgba(220,38,38,0.4)] mb-3">
            <img
              src={`https://mc-heads.net/avatar/${player.ign}/80`}
              alt={player.ign}
              className="w-full h-full rounded-xl bg-zinc-900 object-cover"
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{player.ign}</h2>
          <p className="text-xs text-zinc-400 font-medium">HollowTiers Ranked Player</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 my-5 flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
              OVERALL RATING
            </h4>
            <p className="text-xs text-zinc-500 font-medium">Across all gamemodes</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black block leading-none">Ranked</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {player.points || 0} POINTS
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-6 max-h-60 overflow-y-auto pr-1">
          {gamemodes
            .filter((gm) => gm.id !== 'overall')
            .map((gm) => {
              const targetKey = gm.id === 'vanilla' ? 'crystal' : gm.id;
              const tier = player.tiers?.[targetKey];
              return (
                <div
                  key={gm.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center mb-1 border border-zinc-800/50">
                    <img src={gm.icon} alt={gm.name} className="w-5 h-5 object-contain" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider mb-1">
                    {gm.name}
                  </span>
                  <TierBadge tier={tier} />
                </div>
              );
            })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition duration-200 shadow-lg shadow-red-950/50 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Mengganti icon Overall menjadi custom image PNG
const GAMEMODES_LIST = [
  { id: 'overall', name: 'Overall', icon: '/icon/overall.png' }, // Path ke custom icon kamu
  { id: 'vanilla', name: 'Vanilla', icon: '/icon/vanilla.png' },
  { id: 'sword', name: 'Sword', icon: '/icon/sword.png' },
  { id: 'axe', name: 'Axe', icon: '/icon/axe.png' },
  { id: 'mace', name: 'Mace', icon: '/icon/mace.png' },
  { id: 'diapot', name: 'Diapot', icon: '/icon/pot.png' },
  { id: 'nethpot', name: 'NethPot', icon: '/icon/nethop.png' },
  { id: 'smp', name: 'SMP', icon: '/icon/smp.png' },
  { id: 'diasmp', name: 'Dia SMP', icon: '/icon/smp.png' },
  { id: 'cart', name: 'Cart', icon: '/icon/cart.png' },
  { id: 'spear', name: 'Spear', icon: '/icon/spear.png' },
  { id: 'uhc', name: 'UHC', icon: '/icon/uhc.png' },
];

const TIER_RANKING = [
  'HT1', 'LT1', 
  'HT2', 'LT2', 
  'HT3', 'LT3', 
  'HT4', 'LT4', 
  'HT5', 'LT5', 
  'Tier 4', 'Tier 5'
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('overall');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    document.title = 'HollowTiers - Leaderboard';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .order('points', { ascending: false });

      const { data: tiersData } = await supabase
        .from('player_tiers')
        .select('player_id, gamemode_id, tier');

      if (playersData) {
        const formatted = playersData.map((player) => {
          const playerTiersMap = {};
          if (tiersData) {
            tiersData
              .filter((t) => t.player_id === player.id)
              .forEach((t) => {
                playerTiersMap[t.gamemode_id] = t.tier;
              });
          }
          return {
            ...player,
            tiers: playerTiersMap,
          };
        });

        setPlayers(formatted);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const getFilteredPlayers = () => {
    let result = players;

    const targetGamemode = activeTab === 'vanilla' ? 'crystal' : activeTab;

    if (activeTab !== 'overall') {
      result = result.filter((player) => player.tiers?.[targetGamemode]);

      result = result.sort((a, b) => {
        const tierA = a.tiers[targetGamemode];
        const tierB = b.tiers[targetGamemode];

        const indexA = TIER_RANKING.indexOf(tierA);
        const indexB = TIER_RANKING.indexOf(tierB);

        const rankA = indexA !== -1 ? indexA : 999;
        const rankB = indexB !== -1 ? indexB : 999;

        return rankA - rankB;
      });
    }

    const rankedResult = result.map((player, index) => ({
      ...player,
      originalRank: index
    }));

    if (searchQuery.trim() !== '') {
      return rankedResult.filter((p) =>
        p.ign.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    return rankedResult;
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const filtered = getFilteredPlayers();
      if (filtered.length > 0) {
        setSelectedPlayer(filtered[0]);
      }
    }
  };

  const filteredPlayers = getFilteredPlayers();

  const getRankBadge = (rankIndex) => {
    if (rankIndex === 0) return <span className="text-3xl animate-bounce">👑</span>;
    if (rankIndex === 1) return <span className="text-2xl">🥈</span>;
    if (rankIndex === 2) return <span className="text-2xl">🥉</span>;
    return <span className="font-extrabold text-zinc-500 text-lg">{rankIndex + 1}.</span>;
  };

  const getTop3Style = (rankIndex) => {
    if (rankIndex === 0) {
      return 'bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/30 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 scale-[1.01]';
    }
    if (rankIndex === 1) {
      return 'bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900/50 border-slate-400/70 shadow-[0_0_15px_rgba(148,163,184,0.15)] hover:border-slate-300';
    }
    if (rankIndex === 2) {
      return 'bg-gradient-to-r from-orange-950/40 via-zinc-900 to-orange-950/20 border-amber-700/70 shadow-[0_0_15px_rgba(180,83,9,0.15)] hover:border-amber-600';
    }
    return 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700';
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 font-sans">
      <PlayerModal
        player={selectedPlayer}
        gamemodes={GAMEMODES_LIST}
        onClose={() => setSelectedPlayer(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-wider text-red-500 uppercase">
              Hollow<span className="text-white">Tiers</span>
            </h1>
          </div>

          <nav className="flex items-center gap-6 text-sm font-bold text-zinc-400">
            <a href="#" className="text-white hover:text-red-400">🏠 Home</a>
            <a href="#" className="hover:text-white">☑️ Ranking</a>
            <a href="#" className="hover:text-white">👑 Hall Of Fame</a>
            <a href="#" className="hover:text-white">💬 Discord</a>
          </nav>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search Player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500 w-48 transition"
            />
          </div>
        </header>

        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-2">
          {GAMEMODES_LIST.map((gm) => (
            <button
              key={gm.id}
              onClick={() => setActiveTab(gm.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                activeTab === gm.id
                  ? 'bg-zinc-900 border-red-600/80 text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <img
                src={gm.icon}
                alt={gm.name}
                className="w-5 h-5 mb-1 object-contain drop-shadow"
              />
              <span className="text-[11px] font-bold whitespace-nowrap">{gm.name}</span>
            </button>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between text-xs font-black tracking-wider text-red-500 uppercase pb-4 px-4 border-b border-zinc-800/80 mb-4">
            <div className="flex items-center gap-6">
              <span className="w-8">#</span>
              <span>PLAYER</span>
            </div>
            <span>
              {activeTab === 'overall'
                ? 'TIERS'
                : `${activeTab.toUpperCase()} TIER`}
            </span>
          </div>

          {loading ? (
            <div className="text-center text-zinc-500 py-12">Loading rankings...</div>
          ) : filteredPlayers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-2xl transition gap-4 relative overflow-hidden cursor-pointer ${getTop3Style(
                    player.originalRank
                  )}`}
                >
                  {player.originalRank === 0 && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider shadow">
                      #1 Champion
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">{getRankBadge(player.originalRank)}</div>
                    <img
                      src={`https://mc-heads.net/avatar/${player.ign}/40`}
                      alt={player.ign}
                      className={`w-10 h-10 rounded-xl bg-zinc-800 ${
                        player.originalRank === 0 ? 'ring-2 ring-amber-400/80' : ''
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-bold text-base ${
                            player.originalRank === 0 ? 'text-amber-300' : 'text-white'
                          }`}
                        >
                          {player.ign}
                        </h3>
                        <RegionBadge region={player.region} />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {activeTab === 'overall' ? (
                          `${player.points || 0} points`
                        ) : (
                          <span className="flex items-center gap-1 mt-1">
                            Tier:{' '}
                            <TierBadge
                              tier={
                                player.tiers[
                                  activeTab === 'vanilla' ? 'crystal' : activeTab
                                ]
                              }
                            />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {GAMEMODES_LIST.filter((gm) => gm.id !== 'overall').map((gm) => {
                      const targetKey = gm.id === 'vanilla' ? 'crystal' : gm.id;
                      const tier = player.tiers?.[targetKey];
                      const isCurrentTab = gm.id === activeTab;
                      return (
                        <div
                          key={gm.id}
                          className={`flex flex-col items-center min-w-[38px] p-1 rounded-lg ${
                            isCurrentTab
                              ? 'bg-red-950/60 border border-red-800/60'
                              : ''
                          }`}
                        >
                          <img
                            src={gm.icon}
                            alt={gm.name}
                            className={`w-5 h-5 mb-1 object-contain ${
                              isCurrentTab ? 'opacity-100 scale-110' : 'opacity-70'
                            }`}
                          />
                          <TierBadge tier={tier} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-12 italic">
              No players found in this category.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
