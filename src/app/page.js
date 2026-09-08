'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Pemain dari Supabase
  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('points', { ascending: false }); // Urutkan berdasarkan poin tertinggi

      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    }

    fetchPlayers();
  }, []);

  // 2. LOGIKA RANK ASLI + FILTER SEARCH
  // Pertama: Tambahkan 'originalRank' (index + 1) berdasarkan posisi asli di leaderboard
  const rankedPlayers = players.map((player, index) => ({
    ...player,
    originalRank: index + 1
  }));

  // Kedua: Filter berdasarkan pencarian nama (IGN)
  const filteredPlayers = rankedPlayers.filter((player) =>
    player.ign.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🏆 HollowTiers Leaderboard</h1>

        {/* Search Bar Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari IGN player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        {/* Tabel Leaderboard */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left bg-slate-800">
            <thead className="bg-slate-700 text-slate-300">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">IGN</th>
                <th className="p-4">Region</th>
                <th className="p-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400">
                    Loading leaderboard data...
                  </td>
                </tr>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-750">
                    {/* Menggunakan originalRank agar nomor rank tidak berubah jadi #1 saat dicari */}
                    <td className="p-4 font-bold text-red-400">
                      #{player.originalRank}
                    </td>
                    <td className="p-4 font-medium">{player.ign}</td>
                    <td className="p-4">{player.region || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-yellow-400">
                      {player.points} pts
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400">
                    Pemain tidak ditemukan.
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
