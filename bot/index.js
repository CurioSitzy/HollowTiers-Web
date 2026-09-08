require('dotenv').config({ path: '.env.local' });
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Inisialisasi koneksi Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Poin yang didapatkan player berdasarkan Tier
const TIER_POINTS = {
  'HT1': 100, 'LT1': 80,
  'HT2': 60,  'LT2': 50,
  'HT3': 40,  'LT3': 30,
  'HT4': 20,  'LT4': 15,
  'HT5': 10,  'LT5': 5,
};

// Pilihan Slash Command /addtier
const commands = [
  new SlashCommandBuilder()
    .setName('addtier')
    .setDescription('Add or update a player tier rank')
    .addStringOption(option =>
      option.setName('ign')
        .setDescription('Minecraft In-Game Name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('gamemode')
        .setDescription('Gamemode category')
        .setRequired(true)
        .addChoices(
          { name: 'Sword', value: 'sword' },
          { name: 'Axe', value: 'axe' },
          { name: 'Mace', value: 'mace' },
          { name: 'Diapot', value: 'diapot' },
          { name: 'NethPot', value: 'nethpot' },
          { name: 'SMP', value: 'smp' },
          { name: 'Cart', value: 'cart' },
          { name: 'Spear', value: 'spear' },
          { name: 'UHC', value: 'uhc' }
        )
    )
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Tier rank')
        .setRequired(true)
        .addChoices(
          { name: 'HT1', value: 'HT1' },
          { name: 'LT1', value: 'LT1' },
          { name: 'HT2', value: 'HT2' },
          { name: 'LT2', value: 'LT2' },
          { name: 'HT3', value: 'HT3' },
          { name: 'LT3', value: 'LT3' },
          { name: 'HT4', value: 'HT4' },
          { name: 'LT4', value: 'LT4' },
          { name: 'HT5', value: 'HT5' },
          { name: 'LT5', value: 'LT5' }
        )
    )
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Event ketika bot aktif
client.once('ready', async () => {
  console.log(`🤖 Bot HollowTiers Online as ${client.user.tag}`);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash command /addtier successfully registered!');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

// Event ketika perintah /addtier diketik di Discord
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'addtier') {
    await interaction.deferReply();

    const ign = interaction.options.getString('ign');
    const gamemode = interaction.options.getString('gamemode');
    const tier = interaction.options.getString('tier');

    try {
      // 1. Cek atau buat data player di tabel players
      let { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('ign', ign)
        .single();

      if (!player) {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert([{ ign: ign, points: 0 }])
          .select()
          .single();

        if (createError) throw createError;
        player = newPlayer;
      }

      // 2. Simpan atau perbarui tier di tabel player_tiers
      const { error: tierError } = await supabase
        .from('player_tiers')
        .upsert(
          {
            player_id: player.id,
            gamemode_id: gamemode,
            tier: tier,
          },
          { onConflict: 'player_id, gamemode_id' }
        );

      if (tierError) throw tierError;

      // 3. Hitung ulang total poin player dari seluruh gamemode
      const { data: allTiers } = await supabase
        .from('player_tiers')
        .select('tier')
        .eq('player_id', player.id);

      let totalPoints = 0;
      if (allTiers) {
        allTiers.forEach(t => {
          totalPoints += TIER_POINTS[t.tier] || 0;
        });
      }

      // Update total poin terbaru ke tabel players
      await supabase
        .from('players')
        .update({ points: totalPoints })
        .eq('id', player.id);

      await interaction.editReply(
        `✅ Success! Updated **${ign}** -> **${tier}** in **${gamemode.toUpperCase()}** (Total Points: ${totalPoints})`
      );
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ Error updating database: ${err.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);