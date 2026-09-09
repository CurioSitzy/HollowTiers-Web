import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

// ID Channel Khusus Command Result
const COMMAND_CHANNEL_ID = '1509184085015269516';

// Pilihan Rank dari N/A sampai HT1
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
                .setDescription('Region (e.g. NA, EU, AS, AU, SA)')
                .setRequired(true)
                .addChoices(
                    { name: 'NorthAmerica (NA)', value: 'NA' },
                    { name: 'Europe (EU)', value: 'EU' },
                    { name: 'Asia (AS)', value: 'AS' },
                    { name: 'Australia (AU)', value: 'AU' },
                    { name: 'SouthAmerica (SA)', value: 'SA' }
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
        // Cek ID Channel terlebih dahulu
        if (interaction.channelId !== COMMAND_CHANNEL_ID) {
            return await interaction.reply({
                content: `❌ Command ini hanya dapat digunakan di channel <#${COMMAND_CHANNEL_ID}>!`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Defer reply secara publik
        await interaction.deferReply();

        // Mengambil seluruh input nilai opsi
        const player = interaction.options.getUser('player');
        const tester = interaction.options.getUser('tester');
        const region = interaction.options.getString('region');
        const username = interaction.options.getString('username');
        const gamemode = interaction.options.getString('gamemode');
        const previousRank = interaction.options.getString('previous_rank');
        const rankEarned = interaction.options.getString('rank_earned');

        // 1. Simpan data ke Database Supabase
        if (supabase) {
            try {
                await supabase.from('test_results').insert([
                    {
                        player_discord_id: player.id,
                        tester_discord_id: tester.id,
                        region: region,
                        minecraft_username: username,
                        gamemode: gamemode,
                        previous_rank: previousRank,
                        rank_earned: rankEarned,
                        created_at: new Date()
                    }
                ]);
            } catch (dbErr) {
                console.error('Supabase Error:', dbErr);
            }
        }

        // 2. Render Bust 3D Skin Minecraft via Visage API
        const minecraftAvatarUrl = `https://visage.surgeplay.com/bust/512/${username}`;

        // 3. Susun Embed persis sesuai tampilan visual
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: `${username}'s Test Results`, 
                iconURL: player.displayAvatarURL({ dynamic: true }) 
            })
            .setColor('#D00000') // Garis pinggir warna merah
            .setThumbnail(minecraftAvatarUrl)
            .addFields(
                { name: 'Tester:', value: `<@${tester.id}>`, inline: false },
                { name: 'Region:', value: `\`${region}\``, inline: false },
                { name: 'Username:', value: `\`${username}\``, inline: false },
                { name: 'Previous Rank:', value: `\`${previousRank}\``, inline: false },
                { name: 'Rank Earned:', value: `\`${rankEarned}\``, inline: false },
                { name: 'Gamemode:', value: `\`${gamemode}\``, inline: false }
            );

        // 4. Balas dengan teks mention + Embed
        return await interaction.editReply({
            content: `<@${player.id}> [${region}]`,
            embeds: [embed]
        });
    }
};
