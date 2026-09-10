import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';

// ID Role Tester di Server Discord
const TESTER_ROLE_IDS = [
  '1502537249131335710', // Role Tester
  '1500479159485595722', // Role Verified Tester
];

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the top player from the waitlist and create a testing ticket'),

  async execute(interaction, client, supabase) {
    // Gunakan MessageFlags.Ephemeral untuk standar Discord.js v14+
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // ==========================================
    // 1. PENGECEKAN ROLE TESTER / VERIFIED TESTER
    // ==========================================
    const member = interaction.member;
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ **Akses Ditolak!** Hanya **Tester** dan **Verified Tester** yang dapat menggunakan command ini.'
      });
    }

    const db = supabase || client?.supabase;
    let player = null;

    // ==========================================
    // 2. AMBIL PLAYER DARI SERVICE / SUPABASE
    // ==========================================
    if (global.waitlistService && typeof global.waitlistService.pullNextPlayer === 'function') {
      player = global.waitlistService.pullNextPlayer();
    } else if (db) {
      const { data } = await db
        .from('waitlists')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        player = { id: data.discord_id, username: data.username || 'player' };
        await db.from('waitlists').update({ status: 'testing' }).eq('id', data.id);
      }
    }

    if (!player) {
      return interaction.editReply({
        content: '❌ The waitlist is empty. No players to pull.'
      });
    }

    const guild = interaction.guild;

    // ==========================================
    // 3. CARI CATEGORY TICKET
    // ==========================================
    let categoryId = process.env.TICKET_CATEGORY_ID;

    if (!categoryId) {
      const ticketCategory = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && 
               (c.name.toUpperCase().includes('TICKET') || c.name.toUpperCase().includes('TESTING'))
      );
      if (ticketCategory) {
        categoryId = ticketCategory.id;
      }
    }

    try {
      // ==========================================
      // 4. BUAT ROOM TICKET RAHASIA
      // ==========================================
      const ticketChannel = await guild.channels.create({
        name: `ticket-${player.username || player.id}`,
        type: ChannelType.GuildText,
        parent: categoryId || null,
        permissionOverwrites: [
          {
            // Sembunyikan room dari member biasa
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            // Akses untuk Player yang dipull
            id: player.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          {
            // Akses untuk Tester yang menjalankan command
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ]
      });

      // Register Ticket ke Waitlist Service Lokal (jika ada)
      if (global.waitlistService && typeof global.waitlistService.registerTicket === 'function') {
        global.waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id);
      }

      // ==========================================
      // 5. CATAT KE SUPABASE & KIRIM PESAN
      // ==========================================
      if (db) {
        await db.from('tickets').insert({
          channel_id: ticketChannel.id,
          player_id: player.id,
          tester_id: interaction.user.id,
          status: 'open',
          created_at: new Date().toISOString()
        }).catch((err) => console.error('Gagal catat ticket ke Supabase:', err.message));
      }

      await ticketChannel.send({
        content: `Hello <@${player.id}>! Your testing ticket channel has been created by Tester <@${interaction.user.id}>.\nUse \`/close\` once the testing session is finished.`
      });

      return interaction.editReply({
        content: `✅ Successfully pulled <@${player.id}>. Created private room: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Failed to create ticket channel:', error);
      return interaction.editReply({
        content: `❌ An error occurred while creating the ticket channel: \`${error.message}\``
      });
    }
  }
};
