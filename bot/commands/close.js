import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// ID Role Tester & Verified Tester di Server Discord
const TESTER_ROLE_IDS = [
  '1502537249131335710', // Ganti dengan ID Role Tester
  '1500479159485595722', // Ganti dengan ID Role Verified Tester
];

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close and delete this testing ticket channel'),

  async execute(interaction, client, supabase) {
    const member = interaction.member;
    const channel = interaction.channel;
    const db = supabase || client?.supabase;

    // ==========================================
    // 1. PENGECEKAN ROLE TESTER / VERIFIED TESTER
    // ==========================================
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **Acces Denied!** Only **Tester** and **Verified Tester** who use this command.',
        ephemeral: true
      });
    }

    // ==========================================
    // 2. CEK VALIDASI TICKET CHANNEL
    // ==========================================
    let isTicketChannel = false;

    // Cek A: Menggunakan Service Lokal
    if (global.waitlistService && typeof global.waitlistService.getTicket === 'function') {
      isTicketChannel = Boolean(global.waitlistService.getTicket(channel.id));
    }

    // Cek B: Menggunakan Supabase Database / Nama Channel Fallback
    if (!isTicketChannel && db) {
      const { data } = await db
        .from('tickets')
        .select('*')
        .eq('channel_id', channel.id)
        .eq('status', 'open')
        .maybeSingle();

      if (data) {
        isTicketChannel = true;
      }
    }

    // Fallback Cek C: Jika nama channel diawali dengan "ticket-"
    if (!isTicketChannel && channel.name.startsWith('ticket-')) {
      isTicketChannel = true;
    }

    if (!isTicketChannel) {
      return interaction.reply({
        content: '❌ This command can only be used on active Tier Testing Tickets.',
        ephemeral: true
      });
    }

    // ==========================================
    // 3. RESPONS & PROSES PENUTUPAN TICKET
    // ==========================================
    await interaction.reply({
      content: '🔒 Ticket Closed. This channel will be deleted in **5 seconds**...'
    });

    // Clean up lokal jika service ada
    if (global.waitlistService && typeof global.waitlistService.removeTicket === 'function') {
      global.waitlistService.removeTicket(channel.id);
    }

    // Update status ticket di Supabase
    if (db) {
      await db
        .from('tickets')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('channel_id', channel.id)
        .catch(err => console.error('Failed updating status in Supabase:', err.message));
    }

    // ==========================================
    // 4. HAPUS CHANNEL SETELAH 5 DETIK
    // ==========================================
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Failed to delete ticket channel:', error);
      }
    }, 5000);
  }
};
