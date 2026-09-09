import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('testresult')
  .setDescription('Submit test result to the web database')
  .addUserOption(option => 
    option.setName('player')
      .setDescription('Player who took the test')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('tier')
      .setDescription('Assigned Tier (e.g. HT1, LT2, Tier 3)')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('gamemode')
      .setDescription('Gamemode tested (e.g. Sword, Crystal, Mace)')
      .setRequired(true));

export async function execute(interaction, client, supabase) {
  await interaction.deferReply();

  const targetPlayer = interaction.options.getUser('player');
  const tier = interaction.options.getString('tier');
  const mode = interaction.options.getString('gamemode');

  try {
    // 1. Simpan data ke Database Supabase (biar otomatis sync ke Website)
    if (supabase) {
      const { error } = await supabase
        .from('test_results')
        .insert([
          {
            player_id: targetPlayer.id,
            player_name: targetPlayer.username,
            tier: tier,
            gamemode: mode,
            tester_id: interaction.user.id,
            created_at: new Date()
          }
        ]);

      if (error) {
        console.error('Supabase Sync Error:', error);
      }
    }

    // 2. Buat Tampilan Message Embed
    const embed = new EmbedBuilder()
      .setTitle('⚔️ HollowTiers - Test Result')
      .setColor('#5865F2')
      .setThumbnail(targetPlayer.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Player', value: `<@${targetPlayer.id}> (${targetPlayer.username})`, inline: true },
        { name: '🎮 Gamemode', value: `\`${mode}\``, inline: true },
        { name: '🏆 Tier Result', value: `**${tier}**`, inline: true },
        { name: '🛡️ Tested By', value: `<@${interaction.user.id}>`, inline: false }
      )
      .setFooter({ text: 'HollowTiers Automatic Verification System' })
      .setTimestamp();

    // 3. (Opsional) Tambahkan Button jika ada link ke Website
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View on Website')
        .setStyle(ButtonStyle.Link)
        .setURL('https://hollowtiers.vercel.app') // Ganti dengan domain web kamu
    );

    // 4. Balas Interaction dengan Embed
    return await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

  } catch (err) {
    console.error('Error executing testresult:', err);
    return await interaction.editReply({
      content: '❌ Failed to generate test result embed.'
    });
  }
}
