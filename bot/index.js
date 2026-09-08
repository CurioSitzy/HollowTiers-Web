require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak terdeteksi!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TIER_POINTS = {
  'HT1': 100, 'LT1': 80,
  'HT2': 60,  'LT2': 50,
  'HT3': 40,  'LT3': 30,
  'HT4': 20,  'LT4': 15,
  'HT5': 10,  'LT5': 5,
};

const commands = [
  new SlashCommandBuilder()
    .setName('testresults')
    .setDescription('Submit test results and update player tier rank')
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
    .addUserOption(option =>
      option.setName('tester')
        .setDescription('Tester who conducted the test')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Player region')
        .setRequired(false)
        .addChoices(
          { name: 'NA', value: 'NA' },
          { name: 'EU', value: 'EU' },
          { name: 'AS', value: 'AS' },
          { name: 'SA', value: 'SA' },
          { name: 'OCE', value: 'OCE' }
        )
    )
    .addStringOption(option =>
      option.setName('proof')
        .setDescription('Proof image / video link')
        .setRequired(false)
    )
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`🤖 Bot HollowTiers Online as ${client.user.tag}`);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash command /testresults successfully registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'testresults') {
    await interaction.deferReply();

    const ign = interaction.options.getString('ign');
    const gamemode = interaction.options.getString('gamemode');
    const tier = interaction.options.getString('tier');
    const tester = interaction.options.getUser('tester');
    const region = interaction.options.getString('region');
    const proof = interaction.options.getString('proof');

    try {
      const { data: existingPlayers, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('ign', ign);

      if (fetchError) throw fetchError;

      let player = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

      if (!player) {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert([{ ign: ign, points: 0, region: region || null }])
          .select()
          .single();

        if (createError) throw createError;
        player = newPlayer;
      } else if (region) {
        await supabase
          .from('players')
          .update({ region: region })
          .eq('id', player.id);
      }

      const { error: tierError } = await supabase
        .from('player_tiers')
        .upsert(
          {
            player_id: player.id,
            gamemode_id: gamemode,
            tier: tier,
            tester_id: tester ? tester.id : null,
            proof: proof || null
          },
          { onConflict: 'player_id, gamemode_id' }
        );

      if (tierError) throw tierError;

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

      await supabase
        .from('players')
        .update({ points: totalPoints })
        .eq('id', player.id);

      let responseMsg = `✅ Success! Updated **${ign}** -> **${tier}** in **${gamemode.toUpperCase()}** (Total Points: ${totalPoints})`;
      if (tester) responseMsg += `\n**Tester:** <@${tester.id}>`;
      if (region) responseMsg += `\n**Region:** ${region}`;
      if (proof) responseMsg += `\n**Proof:** ${proof}`;

      await interaction.editReply(responseMsg);
    } catch (err) {
      console.error('❌ System Catch Error:', err);
      await interaction.editReply(`❌ Error updating database: ${err.message || 'Unknown Error'}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
