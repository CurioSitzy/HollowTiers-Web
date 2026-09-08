'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
      // For Overall: return all players sorted by points
      return players;
    }

    // For specific Gamemode: get players who have a tier in this gamemode
    const filtered = players.filter((player) => player.tiers?.[activeTab]);

    // Sort by highest tier (HT1 at top)
    return filtered.sort((a, b) => {
      const tierA = a.tiers[activeTab];
      const tierB = b.tiers[activeTab];

      const indexA = TIER_RANKING.indexOf(tierA);
      const indexB = TIER_RANKING.indexOf(tierB);

      // If tier is not in TIER_RANKING list, place at bottom
      const rankA = indexA !== -1 ? indexA : 999;
      const rankB = indexB !== -1 ? indexB : 999;

      return rankA - rankB;
    });
  };

  const filteredPlayers = getFilteredPlayers();

  const getRankBadge = (index) => {
    if (index === 0) return <span className="text-2xl">🥇</span>;
    if (index === 1) return <span className="text-2xl">🥈</span>;
    if (index === 2) return <span className="text-2xl">🥉</span>;
    return <span className="font-extrabold text-zinc-500 text-lg">{index + 1}.</span>;
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
              {filteredPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 p-4 rounded-2xl transition gap-4"
                >
                  {/* Left: Rank, Avatar, IGN, Points */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">{getRankBadge(index)}</div>
                    <img
                      src={`https://mc-heads.net/avatar/${player.ign}/40`}
                      alt={player.ign}
                      className="w-10 h-10 rounded-xl bg-zinc-800"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base">{player.ign}</h3>
                      <p className="text-xs text-zinc-400">
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
              ))}
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