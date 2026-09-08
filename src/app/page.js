'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
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

    fetchPlayers();
  }, []);

  // LOGIKA RANK ASLI + SEARCH
  const rankedPlayers = [...players]
    .sort((a, b) => b.points - a.points)
    .map((player, index) => ({
      ...player,
      originalRank: index + 1 // Simpan posisi rank asli
    }));

  const filteredPlayers = rankedPlayers.filter((player) =>
    player.ign.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
            <span>🏆</span> HollowTiers Leaderboard
          </h1>
          <p className="text-gray-400 text-sm">Official Player Ranking & Tier List</p>
        </div>

        {/* Search Bar Input */}
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search player IGN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 rounded-xl bg-[#121722] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-lg"
          />
        </div>

        {/* Tabel Leaderboard UI Dark */}
        <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-[#121722]/60 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#161c28] text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">IGN</th>
                <th className="py-4 px-6">Region</th>
                <th className="py-4 px-6 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    Loading leaderboard data...
                  </td>
                </tr>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-[#1a2130]/80 transition-colors duration-150"
                  >
                    {/* Menggunakan originalRank agar nomor rank tidak berubah jadi #1 saat dicari */}
                    <td className="py-4 px-6 font-bold text-red-500">
                      #{player.originalRank}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-200">
                      {player.ign}
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-mono">
                      {player.region || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-amber-400">
                      {player.points} pts
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No players found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
