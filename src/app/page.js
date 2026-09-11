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

// Komponen Badge Tier Berwarna (HT1 - LT5) + Support Retired
function TierBadge({ tier }) {
  if (!tier) return <span className="text-zinc-600 font-bold text-[10px] mt-1">-</span>;

  const rawTier = tier.toString().trim();
  const isRetired = rawTier.toLowerCase().includes('retired');
  const cleanTier = rawTier.replace(/retired/i, '').trim().toUpperCase();

  const getTierStyle = () => {
    if (isRetired) {
      return 'bg-zinc-800 text-zinc-400 border-zinc-600';
    }

    switch (cleanTier) {
      case 'HT1':
        return 'bg-yellow-500 text-black border-yellow-300 font-black shadow-[0_0_8px_rgba(234,179,8,0.5)]';
      case 'LT1':
        return 'bg-amber-600 text-amber-100 border-amber-400 font-extrabold';
      case 'HT2':
        return 'bg-purple-600 text-white border-purple-400 font-extrabold shadow-[0_0_8px_rgba(147,51,234,0.5)]';
      case 'LT2':
        return 'bg-purple-900/90 text-purple-200 border-purple-500 font-extrabold';
      case 'HT3':
        return 'bg-red-600 text-white border-red-400 font-bold';
      case 'LT3':
        return 'bg-red-900/90 text-red-200 border-red-600 font-bold';
      case 'HT4':
      case 'TIER 4':
        return 'bg-blue-600 text-white border-blue-400 font-semibold';
      case 'LT4':
        return 'bg-blue-900/90 text-blue-200 border-blue-600 font-semibold';
      case 'HT5':
      case 'TIER 5':
        return 'bg-emerald-600 text-white border-emerald-400 font-medium';
      case 'LT5':
        return 'bg-zinc-700 text-zinc-200 border-zinc-500 font-medium';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-600';
    }
  };

  return (
    <span
      className={`mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-black border tracking-wider uppercase transition-all whitespace-nowrap shadow-md ${getTierStyle()}`}
    >
      {cleanTier}
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
              const tier = player.tiers?.[gm.id];
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

// Daftar Gamemode
const GAMEMODES_LIST = [
  { id: 'overall', name: 'Overall', icon: '/icon/overall.png' },
  { id: 'vanilla', name: 'Vanilla', icon: '/icon/vanilla.png' },
  { id: 'sword', name: 'Sword', icon: '/icon/sword.png' },
  { id: 'axe', name: 'Axe', icon: '/icon/axe.png' },
  { id: 'mace', name: 'Mace', icon: '/icon/mace.png' },
  { id: 'diapot', name: 'Diapot', icon: '/icon/pot.png' },
  { id: 'nethpot', name: 'NethPot', icon: '/icon/nethop.png' },
  { id: 'smp', name: 'SMP', icon: '/icon/smp.png' },
  { id: 'diasmp', name: 'Dia SMP', icon: '/icon/Diasmp.png' },
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

    if (activeTab !== 'overall') {
      result = result.filter((player) => player.tiers?.[activeTab]);

      result = result.sort((a, b) => {
        const tierA = (a.tiers[activeTab] || '').replace(/retired/i, '').trim();
        const tierB = (b.tiers[activeTab] || '').replace(/retired/i, '').trim();

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
                            <TierBadge tier={player.tiers[activeTab]} />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* GAMEMODES LIST WITH HOVER BOX & SOLID BADGES */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {GAMEMODES_LIST.filter((gm) => gm.id !== 'overall').map((gm) => {
                      const tier = player.tiers?.[gm.id];
                      const isCurrentTab = gm.id === activeTab;
                      const isRetired = tier?.toString().toLowerCase().includes('retired');

                      return (
                        <div
                          key={gm.id}
                          className={`group relative flex flex-col items-center justify-center min-w-[50px] p-2 rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing ${
                            isCurrentTab
                              ? 'bg-red-950/40 border border-red-800/60'
                              : 'hover:bg-zinc-800/80 hover:shadow-lg hover:scale-105 border border-transparent'
                          }`}
                        >
                          {/* TOOLTIP HOVER (Status Retired & Points) */}
                          {tier && (
                            <div className="absolute -top-12 hidden group-hover:flex flex-col items-center justify-center bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-lg shadow-2xl z-50 pointer-events-none whitespace-nowrap">
                              <span className="text-white font-black text-[11px] tracking-wide">
                                {tier}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-semibold">
                                {player.points || 0} points
                              </span>
                              <div className="w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 -bottom-1 absolute"></div>
                            </div>
                          )}

                          {/* IKON GAMEMODE */}
                          <div className="w-7 h-7 flex items-center justify-center">
                            <img
                              src={gm.icon}
                              alt={gm.name}
                              className={`w-6 h-6 object-contain transition-all ${
                                isRetired
                                  ? 'opacity-30 grayscale'
                                  : isCurrentTab
                                    ? 'opacity-100 scale-110'
                                    : 'opacity-70 group-hover:opacity-100'
                              }`}
                            />
                          </div>

                          {/* BADGE TIER SOLID */}
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
