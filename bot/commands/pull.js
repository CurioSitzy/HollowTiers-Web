import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';

const TESTER_ROLE_IDS = [
  '1502537249131335710',
  '1500479159485595722',
];

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the top player from the waitlist and create a testing ticket'),

  async execute(interaction, guildConfig, client, supabase) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Role Permission Check
    const member = interaction.member;
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ **Access Denied!** Only **Tester** and **Verified Tester** roles can use this command.'
      });
    }

    // 2. Pull Player via waitlistService
    const result = waitlistService.pullNextPlayer();

    if (!result || !result.player) {
      return interaction.editReply({
        content: '❌ The waitlist is empty or no active queues are open.'
      });
    }

    const { player, modeName } = result;
    const guild = interaction.guild;
    const categoryId = process.env.TICKET_CATEGORY_ID;

    // ==========================================
    // 3. HAPUS PLAYER DARI QUEUE & HAPUS ROLE
    // ==========================================
    if (typeof waitlistService.removePlayer === 'function') {
      waitlistService.removePlayer(modeName, player.id);
    }

    // Hapus role waitlist dari member di Discord
    const targetWaitlistRoleId = typeof waitlistService.getWaitlistRole === 'function' 
      ? waitlistService.getWaitlistRole(modeName) 
      : null;

    if (targetWaitlistRoleId) {
      const pulledMember = await guild.members.fetch(player.id).catch(() => null);
      if (pulledMember && pulledMember.roles.cache.has(targetWaitlistRoleId)) {
        await pulledMember.roles.remove(targetWaitlistRoleId).catch((err) => {
          console.error(`Failed to remove waitlist role from ${player.id}:`, err);
        });
      }
    }

    // Perbarui status antrean di Supabase jika menggunakan DB
    const db = supabase || client?.supabase;
    if (db) {
      await db
        .from('waitlists')
        .update({ status: 'testing' })
        .eq('discord_id', player.id)
        .eq('status', 'waiting')
        .catch((err) => console.error('Failed updating waitlist status in Supabase:', err.message));
    }

    try {
      // 4. Create Ticket Channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${player.username || player.id}`,
        type: ChannelType.GuildText,
        parent: categoryId || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: player.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          {
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

      // 5. Register Ticket into waitlistService memory
      if (typeof waitlistService.registerTicket === 'function') {
        waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id, modeName);
      }

      await ticketChannel.send({
        content: `Hello <@${player.id}>! Your testing ticket channel for **${modeName}** has been created by Tester <@${interaction.user.id}>.\nUse \`/close\` once the testing session is finished.`
      });

      return interaction.editReply({
        content: `✅ Successfully pulled <@${player.id}> (${modeName}) and removed them from the queue. Ticket channel created: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Failed to create ticket channel:', error);
      return interaction.editReply({
        content: `❌ An error occurred while creating the ticket channel: \`${error.message}\``
      });
    }
  }
};
