import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

// ID Channel Input & Output
const INPUT_CHANNEL_ID = '1509184085015269516'; // Channel #result-commands
const OUTPUT_CHANNEL_ID = '1500797205382959164'; // Ganti dengan ID Channel Output jika beda

const RANK_CHOICES = [
    { name: 'N/A', value: 'N/A' },
    { name: 'LT5', value: 'LT5' },
    { name: 'HT5', value: 'HT5' },
    { name: 'LT4', value: 'LT4' },
    { name: 'HT4', value: 'HT4' },
    { name: 'LT3', value: 'LT3' },
    { name: 'HT3', value: 'HT3' },
    { name: 'LT2', value: 'LT2' },
    { name: 'HT2', value: 'HT2' },
    { name: 'LT1', value: 'LT1' },
    { name: 'HT1', value: 'HT1' },
];

export default {
    category: 'Tiers',
    data: new SlashCommandBuilder()
        .setName('testresult')
        .setDescription('Send a player tier test result')
        .addUserOption(option => 
            option.setName('player')
                .setDescription('The player who was tested')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('tester')
                .setDescription('The tester who conducted the test')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region')
                .setRequired(true)
                .addChoices(
                    { name: 'NorthAmerica (NA)', value: 'NorthAmerica [NA]' },
                    { name: 'Europe (EU)', value: 'Europe [EU]' },
                    { name: 'Asia (AS)', value: 'Asia [AS]' },
                    { name: 'Australia (AU)', value: 'Australia [AU]' },
                    { name: 'SouthAmerica (SA)', value: 'SouthAmerica [SA]' }
                ))
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Minecraft IGN / Username')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('gamemode')
                .setDescription('Gamemode / Tier Test')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'Sword' },
                    { name: 'Axe', value: 'Axe' },
                    { name: 'Crystal', value: 'Crystal' },
                    { name: 'Vanilla', value: 'Vanilla' },
                    { name: 'SMP', value: 'SMP' },
                    { name: 'Diamond SMP', value: 'Diamond SMP' },
                    { name: 'Pot', value: 'Pot' },
                    { name: 'UHC', value: 'UHC' },
                    { name: 'Netherite OP', value: 'Netherite OP' },
                    { name: 'Cart', value: 'Cart' },
                    { name: 'Spear Mace', value: 'Spear Mace' }
                ))
        .addStringOption(option => 
            option.setName('previous_rank')
                .setDescription('Previous rank')
                .setRequired(true)
                .addChoices(...RANK_CHOICES))
        .addStringOption(option => 
            option.setName('rank_earned')
                .setDescription('Rank earned')
                .setRequired(true)
                .addChoices(...RANK_CHOICES)),

    async execute(interaction, client, supabase) {
        if (interaction.channelId !== INPUT_CHANNEL_ID) {
            return await interaction.reply({
                content: `❌ Command ini hanya dapat digunakan di channel <#${INPUT_CHANNEL_ID}>!`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const player = interaction.options.getUser('player');
        const tester = interaction.options.getUser('tester');
        const region = interaction.options.getString('region');
        const username = interaction.options.getString('username');
        const gamemode = interaction.options.getString('gamemode');
        const previousRank = interaction.options.getString('previous_rank');
        const rankEarned = interaction.options.getString('rank_earned');

        // 1. Simpan SEMUA Field Lengkap ke Supabase Database
        if (supabase) {
            try {
                const { error } = await supabase.from('test_results').insert([
                    {
                        player_discord_id: player.id,
                        tester_discord_id: tester.id,
                        region: region,
                        minecraft_username: username,
                        gamemode: gamemode,
                        previous_rank: previousRank,
                        rank_earned: rankEarned, // Rank/Tier tersimpan di kolom khusus ini
                        tier: rankEarned,       // Backup jika di DB kamu nama kolomnya 'tier'
                        created_at: new Date()
                    }
                ]);

                if (error) console.error('❌ Supabase Insert Error:', error);
            } catch (dbErr) {
                console.error('❌ Database Exception:', dbErr);
            }
        }

        // 2. Render Avatar 3D
        const minecraftAvatarUrl = `https://visage.surgeplay.com/bust/512/${username}`;

        // 3. Embed Display
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: `${username}'s Test Results`, 
                iconURL: player.displayAvatarURL({ dynamic: true }) 
            })
            .setColor('#D00000')
            .setThumbnail(minecraftAvatarUrl)
            .addFields(
                { name: 'Tester:', value: `<@${tester.id}>`, inline: false },
                { name: 'Region:', value: `\`${region}\``, inline: false },
                { name: 'Username:', value: `\`${username}\``, inline: false },
                { name: 'Previous Rank:', value: `\`${previousRank}\``, inline: false },
                { name: 'Rank Earned:', value: `\`${rankEarned}\``, inline: false },
                { name: 'Gamemode:', value: `\`${gamemode}\``, inline: false }
            );

        // 4. Send Embed ke Channel Output
        try {
            const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
            if (outputChannel) {
                await outputChannel.send({
                    content: `<@${player.id}> [${region}]`,
                    embeds: [embed]
                });
            }
        } catch (chanErr) {
            console.error('Gagal mengirim ke channel output:', chanErr);
        }

        return await interaction.editReply({
            content: `✅ Test result berhasil tersimpan di database dan dikirim ke <#${OUTPUT_CHANNEL_ID}>!`
        });
    }
};
