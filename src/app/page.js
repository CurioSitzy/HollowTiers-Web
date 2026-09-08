'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Daftar Tab Gamemode beserta Ikon/Emoji
const GAMEMODES = [
  { id: 'overall', name: 'Overall', icon: '🟣' },
  { id: 'sword', name: 'Sword', icon: '⚔️' },
  { id: 'axe', name: 'Axe', icon: '🪓' },
  { id: 'mace', name: 'Mace', icon: '🔨' },
  { id: 'diapot', name: 'Diapot', icon: '🧪' },
  { id: 'nethpot', name: 'NethPot', icon: '🟣' },
  { id: 'smp', name: 'SMP', icon: '🟢' },
  { id: 'cart', name: 'Cart', icon: '🧨' },
  { id: 'spear', name: 'Spear', icon: '🗡️' },
  { id: 'uhc', name: 'UHC', icon: '❤️' },
];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [selectedGamemode, setSelectedGamemode] = useState('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('points', { ascending: false });

      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [selectedGamemode]);

  // LOGIKA UTAMA: Berikan nomor rank asli SEBELUM difilter pencarian
  const rankedPlayers = [...players]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .map((player, index) => ({
      ...player,
      originalRank: index + 1
    }));

  // Filter pencarian berdasarkan IGN tanpa mengubah originalRank
  const filteredPlayers = rankedPlayers.filter((player) =>
    player.ign?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. TOP NAVBAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#111113] border border-[#222226] rounded-xl px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black tracking-wider text-red-600 uppercase">
              HOLLOW<span className="text-white">TIERS</span>
            </h1>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
              <a href="#" className="flex items-center gap-2 hover:text-white transition">
                <span>🏠</span> Home
              </a>
              <a href="#" className="flex items-center gap-2 text-white font-bold">
                <span>☑️</span> Ranking
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition">
                <span>👑</span> Hall Of Fame
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition">
                <span>💬</span> Discord
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search Player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#18181c] border border-[#2a2a30] text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:border-red-600 transition"
            />
            <div className="hidden sm:flex items-center gap-2 bg-[#0d281e] border border-[#1b5e3f] text-[#34d399] text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
              Hollow Tiers
            </div>
          </div>
        </header>

        {/* 2. GAMEMODE TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GAMEMODES.map((gm) => {
            const isActive = selectedGamemode === gm.id;
            return (
              <button
                key={gm.id}
                onClick={() => setSelectedGamemode(gm.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-[#141418] border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                    : 'bg-[#111113] border-[#222226] text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                <span className="text-base">{gm.icon}</span>
                <span>{gm.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. LEADERBOARD TABLE CARD */}
        <div className="bg-[#111113] border border-[#222226] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#222226] text-xs font-extrabold text-red-600 tracking-wider uppercase">
            <div className="flex items-center gap-8">
              <span className="w-8">#</span>
              <span>PLAYER</span>
            </div>
            <span>TIERS</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Loading players...
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="divide-y divide-[#1c1c22]">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-[#16161a] transition"
                >
                  <div className="flex items-center gap-8">
                    {/* Menggunakan player.originalRank agar nomor rank tidak berubah jadi #1 saat dicari */}
                    <span className="w-8 font-black text-red-600 text-sm">
                      {player.originalRank}
                    </span>
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://visage.surgeplay.com/bust/32/${player.ign || 'Steve'}`}
                        alt={player.ign}
                        className="w-7 h-7 rounded"
                        onError={(e) => {
                          e.target.src = 'https://visage.surgeplay.com/bust/32/Steve';
                        }}
                      />
                      <span className="font-bold text-sm text-gray-200">
                        {player.ign}
                      </span>
                      {player.region && (
                        <span className="text-xs bg-[#1a1a20] text-gray-400 border border-[#2a2a34] px-2 py-0.5 rounded font-mono">
                          {player.region}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-400">
                      {player.points || 0} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No players found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
