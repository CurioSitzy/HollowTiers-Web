import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

const INPUT_CHANNEL_ID = '1509184085015269516'; // Channel #result-commands
const OUTPUT_CHANNEL_ID = '1500797205382959164'; // Channel Output Embed

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

// Tabel Nilai Poin per Tier
const TIER_POINTS = {
    'HT1': 10,
    'LT1': 9,
    'HT2': 8,
    'LT2': 7,
    'HT3': 6,
    'LT3': 5,
    'HT4': 4,
    'LT4': 3,
    'HT5': 2,
    'LT5': 1,
    'N/A': 0
};

// Mapping pilihan gamemode ke ID di tabel gamemodes
const GAMEMODE_MAPPING = {
    'Sword': 'sword',
    'Axe': 'axe',
    'Crystal': 'crystal',
    'Vanilla': 'vanilla',
    'SMP': 'smp',
    'Diamond SMP': 'diasmp',
    'Pot': 'pot',
    'UHC': 'uhc',
    'Netherite OP': 'nethop',
    'Cart': 'cart',
    'Spear Mace': 'spearmace'
};

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

        // 1. AUTO ADD DISCORD ROLE
        let roleAddedStatus = '';
        if (interaction.guild && rankEarned !== 'N/A') {
            try {
                const member = await interaction.guild.members.fetch(player.id).catch(() => null);
                if (member) {
                    const targetRole = interaction.guild.roles.cache.find(role => {
                        const name = role.name.toLowerCase();
                        const rankStr = rankEarned.toLowerCase();
                        const modeStr = gamemode.toLowerCase();

                        return (
                            name === `${rankStr} ${modeStr}` ||
                            name === `${modeStr} ${rankStr}` ||
                            name === `${rankStr}-${modeStr}` ||
                            name === rankStr
                        );
                    });

                    if (targetRole) {
                        await member.roles.add(targetRole);
                        roleAddedStatus = `\n🎖️ Role **${targetRole.name}** berhasil diberikan!`;
                    }
                }
            } catch (roleErr) {
                console.error('❌ Error giving role:', roleErr);
            }
        }

        // 2. SIMPAN KE DATABASE SUPABASE & HITUNG POIN
        if (supabase) {
            try {
                // A. Simpan/Update Player ke tabel `players`
                const { data: playerData, error: playerErr } = await supabase
                    .from('players')
                    .upsert([
                        {
                            discord_id: player.id,
                            ign: username,
                            region: region,
                            type: 'Java'
                        }
                    ], { onConflict: 'ign' })
                    .select('id')
                    .single();

                if (playerErr) {
                    console.error('❌ Error saving to players:', playerErr);
                } else if (playerData) {
                    const playerId = playerData.id;
                    const mappedGamemodeId = GAMEMODE_MAPPING[gamemode] || gamemode.toLowerCase();

                    // B. Simpan / Update Tier ke `player_tiers`
                    const { error: tierErr } = await supabase
                        .from('player_tiers')
                        .upsert([
                            {
                                player_id: playerId,
                                gamemode_id: mappedGamemodeId,
                                tier: rankEarned,
                                updated_at: new Date().toISOString()
                            }
                        ], { onConflict: 'player_id,gamemode_id' });

                    if (tierErr) {
                        console.error('❌ Error saving to player_tiers:', tierErr);
                    } else {
                        // C. Hitung Ulang Total Poin Player dari Semua Gamemode yang Dia Punya
                        const { data: allTiers, error: fetchTiersErr } = await supabase
                            .from('player_tiers')
                            .select('tier')
                            .eq('player_id', playerId);

                        if (!fetchTiersErr && allTiers) {
                            const totalPoints = allTiers.reduce((sum, item) => {
                                const pt = TIER_POINTS[item.tier] || 0;
                                return sum + pt;
                            }, 0);

                            // Update total poin ke tabel players
                            const { error: updatePointErr } = await supabase
                                .from('players')
                                .update({ points: totalPoints })
                                .eq('id', playerId);

                            // Jika di DB kamu nama kolom poinnya 'point' (tanpa s), coba cadangan ini jika 'points' error
                            if (updatePointErr && updatePointErr.code === 'PGRST204') {
                                await supabase
                                    .from('players')
                                    .update({ point: totalPoints })
                                    .eq('id', playerId);
                            }
                        }
                    }
                }
            } catch (dbErr) {
                console.error('❌ Database Exception:', dbErr);
            }
        }

        // 3. RENDER AVATAR 3D & EMBED
        const minecraftAvatarUrl = `https://visage.surgeplay.com/bust/512/${username}`;

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

        // 4. KIRIM KE OUTPUT CHANNEL
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
            content: `✅ Test result berhasil tersimpan dan dikirim ke <#${OUTPUT_CHANNEL_ID}>!${roleAddedStatus}`
        });
    }
};
