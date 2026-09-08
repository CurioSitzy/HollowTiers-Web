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

const GAMEMODES_LIST = [
  { id: 'overall', name: 'Overall', icon: '/icon/vanilla.png' },
  { id: 'sword', name: 'Sword', icon: '/icon/sword.png' },
  { id: 'axe', name: 'Axe', icon: '/icon/axe.png' },
  { id: 'mace', name: 'Mace', icon: '/icon/mace.png' },
  { id: 'diapot', name: 'Diapot', icon: '/icon/pot.png' },
  { id: 'nethpot', name: 'NethPot', icon: '/icon/nethop.png' },
  { id: 'smp', name: 'SMP', icon: '/icon/smp.png' },
  { id: 'cart', name: 'Cart', icon: '/icon/cart.png' },
  { id: 'spear', name: 'Spear', icon: '/icon/spear.png' },
  { id: 'uhc', name: 'UHC', icon: '/icon/uhc.png' },
];

// Tier ranking hierarchy from highest to lowest
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch all players ordered by highest points
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .order('points', { ascending: false });

      // Fetch all player tier data across all gamemodes
      const { data: tiersData } = await supabase
        .from('player_tiers')
        .select('player_id, gamemode_id, tier');

      if (playersData) {
        // Map tier data to each player
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

  // Filter and sort players based on selected gamemode tab
  const getFilteredPlayers = () => {
    if (activeTab === 'overall') {
      return players;
    }

    const filtered = players.filter((player) => player.tiers?.[activeTab]);

    return filtered.sort((a, b) => {
      const tierA = a.tiers[activeTab];
      const tierB = b.tiers[activeTab];

      const indexA = TIER_RANKING.indexOf(tierA);
      const indexB = TIER_RANKING.indexOf(tierB);

      const rankA = indexA !== -1 ? indexA : 999;
      const rankB = indexB !== -1 ? indexB : 999;

      return rankA - rankB;
    });
  };

  const filteredPlayers = getFilteredPlayers();

  const getRankBadge = (index) => {
    if (index === 0) return <span className="text-3xl animate-bounce">👑</span>;
    if (index === 1) return <span className="text-2xl">🥈</span>;
    if (index === 2) return <span className="text-2xl">🥉</span>;
    return <span className="font-extrabold text-zinc-500 text-lg">{index + 1}.</span>;
  };

  // Helper styling khusus untuk Top 3
  const getTop3Style = (index) => {
    if (index === 0) {
      // Juara 1: Emas (Gold)
      return 'bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/30 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 scale-[1.01]';
    }
    if (index === 1) {
      // Juara 2: Perak (Silver)
      return 'bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900/50 border-slate-400/70 shadow-[0_0_15px_rgba(148,163,184,0.15)] hover:border-slate-300';
    }
    if (index === 2) {
      // Juara 3: Perunggu (Bronze)
      return 'bg-gradient-to-r from-orange-950/40 via-zinc-900 to-orange-950/20 border-amber-700/70 shadow-[0_0_15px_rgba(180,83,9,0.15)] hover:border-amber-600';
    }
    // Player biasa
    return 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700';
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
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
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500 w-48"
            />
          </div>
        </header>

        {/* Gamemodes Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {GAMEMODES_LIST.map((gm) => (
            <button
              key={gm.id}
              onClick={() => setActiveTab(gm.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                activeTab === gm.id
                  ? 'bg-zinc-900 border-red-600/80 text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <img
                src={gm.icon}
                alt={gm.name}
                className="w-6 h-6 mb-1 object-contain drop-shadow"
              />
              <span className="text-xs font-bold">{gm.name}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6">
          {/* Table Header */}
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

          {/* Player Rows */}
          {loading ? (
            <div className="text-center text-zinc-500 py-12">Loading rankings...</div>
          ) : filteredPlayers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredPlayers.map((player, index) => {
                const isTop3 = index < 3;
                return (
                  <div
                    key={player.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-2xl transition gap-4 relative overflow-hidden ${getTop3Style(index)}`}
                  >
                    {/* Visual Tag Top 1/2/3 */}
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider shadow">
                        #1 Champion
                      </div>
                    )}

                    {/* Left: Rank, Avatar, IGN, Region, Points */}
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">{getRankBadge(index)}</div>
                      <img
                        src={`https://mc-heads.net/avatar/${player.ign}/40`}
                        alt={player.ign}
                        className={`w-10 h-10 rounded-xl bg-zinc-800 ${
                          index === 0 ? 'ring-2 ring-amber-400/80' : ''
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-base ${index === 0 ? 'text-amber-300' : 'text-white'}`}>
                            {player.ign}
                          </h3>
                          {/* Region Badge */}
                          <RegionBadge region={player.region} />
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {activeTab === 'overall'
                            ? `${player.points || 0} points`
                            : `Tier: ${player.tiers[activeTab]}`}
                        </p>
                      </div>
                    </div>

                    {/* Right: Tiers Breakdown Per Gamemode */}
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {GAMEMODES_LIST.filter((gm) => gm.id !== 'overall').map((gm) => {
                        const tier = player.tiers?.[gm.id];
                        const isCurrentTab = gm.id === activeTab;
                        return (
                          <div
                            key={gm.id}
                            className={`flex flex-col items-center min-w-[36px] p-1 rounded-lg ${
                              isCurrentTab ? 'bg-red-950/60 border border-red-800/60' : ''
                            }`}
                          >
                            <img
                              src={gm.icon}
                              alt={gm.name}
                              className={`w-5 h-5 mb-1 object-contain ${
                                isCurrentTab ? 'opacity-100 scale-110' : 'opacity-70'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-black ${
                                tier ? 'text-purple-400' : 'text-zinc-600'
                              }`}
                            >
                              {tier || '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-12 italic">
              No players found in this gamemode category.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
