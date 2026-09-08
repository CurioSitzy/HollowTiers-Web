require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak terdeteksi!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// ID Channel untuk command
const COMMAND_CHANNEL_ID = '1509184085015269516'; // #result-commands

// Poin berdasarkan Tier
const TIER_POINTS = {
  'HT1': 100, 'LT1': 80,
  'HT2': 60,  'LT2': 50,
  'HT3': 40,  'LT3': 30,
  'HT4': 20,  'LT4': 15,
  'HT5': 10,  'LT5': 5,
};

// Daftar pilihan Rank
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

// Daftar pilihan Gamemode untuk Slash Command (Sudah termasuk Diamond SMP)
const GAMEMODE_CHOICES = [
  { name: 'Vanilla', value: 'Vanilla' },
  { name: 'Sword', value: 'Sword' },
  { name: 'Axe', value: 'Axe' },
  { name: 'UHC', value: 'UHC' },
  { name: 'SMP', value: 'SMP' },
  { name: 'Diamond SMP', value: 'Diamond SMP' },
  { name: 'Pot', value: 'Pot' },
  { name: 'Netherite OP', value: 'Netherite OP' },
  { name: 'Cart', value: 'Cart' },
  { name: 'Spear Mace', value: 'Spear Mace' }
];

// Mapping Role ID per Gamemode & Tier
const TIER_ROLES = {
  'Crystal': {
    HT1: '1500746475448176793', LT1: '1500746484767789096',
    HT2: '1500746481043247224', LT2: '1500746485455781888',
    HT3: '1500746481609474169', LT3: '1500746486164623551',
    HT4: '1500746482498801714', LT4: '1500746486567145514',
    HT5: '1500746483845173308', LT5: '1500746487368384572',
  },
  'Sword': {
    HT1: '1500753800930000968', LT1: '1500752952250466425',
    HT2: '1500753802599338016', LT2: '1500752952879616011',
    HT3: '1500753805070045254', LT3: '1500752953424871475',
    HT4: '1500753807620046878', LT4: '1500752954758664193',
    HT5: '1500753809662804049', LT5: '1500753017534939199',
  },
  'Axe': {
    HT1: '1502310374140022994', LT1: '1502310389222871140',
    HT2: '1502310377978069012', LT2: '1502310388589396059',
    HT3: '1502310382113652929', LT3: '1502310387465322576',
    HT4: '1502310384797876425', LT4: '1502310386907615252',
    HT5: '1502310386072944751', LT5: '1502310386274275498',
  },
  'UHC': {
    HT1: '1502310022292574448', LT1: '1500756920976281770',
    HT2: '1502310028265132223', LT2: '1500756921769267271',
    HT3: '1502310031603925105', LT3: '1500756922335498251',
    HT4: '1502310035294785728', LT4: '1500756923174355035',
    HT5: '1502310139074576446', LT5: '1500756923627208704',
  },
  'SMP': {
    HT1: '1502540937367257109', LT1: '1502540941582667786',
    HT2: '1502540938306781264', LT2: '1502540934246568066',
    HT3: '1502540939133190306', LT3: '1502540934968250448',
    HT4: '1502540940555059200', LT4: '1502540935819563178',
    HT5: '1502540941582667786', LT5: '1502540936385794179',
  },
  'Diamond SMP': {
    HT1: '1500755032478322759', LT1: '1500479159468822558',
    HT2: '1500755019715313756', LT2: '1500479159456235539',
    HT3: '1500755021904744478', LT3: '1500480067242033323',
    HT4: '1500755024874180628', LT4: '1500479978884825349',
    HT5: '1500755027587764325', LT5: '1500480104046919711',
  },
  'Pot': {
    HT1: '1502312007460847616', LT1: '1502311997591781516',
    HT2: '1502312008580858088', LT2: '1502312002775941332',
    HT3: '1502540229528125483', LT3: '1502312005359505510',
    HT4: '1502540233898463302', LT4: '1502312005883793489',
    HT5: '1502540238587953252', LT5: '1502312006458540162',
  },
  'Netherite OP': {
    HT1: '1500756916358479933', LT1: '1500746484327383120',
    HT2: '1500756917121847430', LT2: '1500756912310976522',
    HT3: '1500756917843394690', LT3: '1500756908741759036',
    HT4: '1500756918594179102', LT4: '1500756915129421946',
    HT5: '1500756919428841532', LT5: '1500756915959889970',
  },
  'Cart': {
    HT1: '1507231753352253440', LT1: '1507231761698918560',
    HT2: '1507231757965983844', LT2: '1507231762512744589',
    HT3: '1507231759341846619', LT3: '1507231763175444480',
    HT4: '1507231760038101162', LT4: '1507231763615846493',
    HT5: '1507231760809726133', LT5: '1507231904242598038',
  },
  'Spear Mace': {
    HT1: '1507226546350592110', LT1: '1507226563777663138',
    HT2: '1507226550548959282', LT2: '1507226566529257553',
    HT3: '1507226553736495194', LT3: '1507226567703658597',
    HT4: '1507226556798341160', LT4: '1507226568076824619',
    HT5: '1546382650355220530', LT5: '1507226568857227395',
  }
};

TIER_ROLES['Vanilla'] = TIER_ROLES['Crystal'];

// Mendaftarkan Slash Command langsung dari index.js
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('testresult')
      .setDescription('Submit player test result')
      .addUserOption(opt => opt.setName('player').setDescription('Player Discord').setRequired(true))
      .addUserOption(opt => opt.setName('tester').setDescription('Tester Discord').setRequired(true))
      .addStringOption(opt => 
        opt.setName('region')
          .setDescription('Player Region')
          .setRequired(true)
          .addChoices(
            { name: 'NA', value: 'NA' },
            { name: 'EU', value: 'EU' },
            { name: 'AS', value: 'AS' },
            { name: 'AU', value: 'AU' },
            { name: 'SA', value: 'SA' }
          )
      )
      .addStringOption(opt => opt.setName('username').setDescription('Minecraft IGN').setRequired(true))
      .addStringOption(opt => 
        opt.setName('gamemode')
          .setDescription('Select Gamemode')
          .setRequired(true)
          .addChoices(...GAMEMODE_CHOICES)
      )
      .addStringOption(opt => 
        opt.setName('previous_rank')
          .setDescription('Previous Rank')
          .setRequired(true)
          .addChoices(...RANK_CHOICES)
      )
      .addStringOption(opt => 
        opt.setName('rank_earned')
          .setDescription('Rank Earned')
          .setRequired(true)
          .addChoices(...RANK_CHOICES)
      ),
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Setup bot configuration')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Memperbarui Slash Command di Discord API...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash Command berhasil diperbarui!');
  } catch (err) {
    console.error('❌ Gagal update Slash Command:', err);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Bot HollowTiers Online sebagai ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'testresult') {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      console.error('❌ Failed to defer reply:', err);
      return;
    }

    if (interaction.channelId !== COMMAND_CHANNEL_ID) {
      return await interaction.editReply({
        content: `❌ Command ini hanya dapat digunakan di channel <#${COMMAND_CHANNEL_ID}>!`
      }).catch(console.error);
    }

    const player = interaction.options.getUser('player');
    const region = interaction.options.getString('region');
    const username = interaction.options.getString('username').trim();
    const gamemode = interaction.options.getString('gamemode');
    const rankEarned = interaction.options.getString('rank_earned');

    try {
      // 1. Dapatkan / Buat Data Player di Supabase Database
      const { data: existingPlayers, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .ilike('ign', username);

      if (fetchError) throw fetchError;

      let playerDb = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

      if (!playerDb) {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert([{ ign: username, points: 0, region: region, type: 'Java' }])
          .select()
          .single();

        if (createError) throw createError;
        playerDb = newPlayer;
      } else {
        await supabase
          .from('players')
          .update({ region: region, ign: username })
          .eq('id', playerDb.id);
      }

      // Format gamemode ID untuk tabel Supabase
      let gamemodeIdFormatted = gamemode.toLowerCase().trim();
      if (gamemodeIdFormatted === 'netherite op') gamemodeIdFormatted = 'nethpot';
      else if (gamemodeIdFormatted === 'pot') gamemodeIdFormatted = 'diapot';
      else if (gamemodeIdFormatted === 'spear mace') gamemodeIdFormatted = 'spear';
      else if (gamemodeIdFormatted === 'diamond smp') gamemodeIdFormatted = 'diasmp';
      else if (gamemodeIdFormatted === 'vanilla') gamemodeIdFormatted = 'crystal';

      // 2. Upsert Tier
      const { error: tierError } = await supabase
        .from('player_tiers')
        .upsert(
          {
            player_id: playerDb.id,
            gamemode_id: gamemodeIdFormatted,
            tier: rankEarned
          },
          { onConflict: 'player_id, gamemode_id' }
        );

      if (tierError) throw tierError;

      // 3. Kalkulasi Ulang Total Poin
      const { data: allTiers } = await supabase
        .from('player_tiers')
        .select('tier')
        .eq('player_id', playerDb.id);

      let totalPoints = 0;
      if (allTiers) {
        allTiers.forEach(t => {
          totalPoints += TIER_POINTS[t.tier] || 0;
        });
      }

      await supabase
        .from('players')
        .update({ points: totalPoints })
        .eq('id', playerDb.id);

      // 4. Update Role Discord Player
      const member = await interaction.guild.members.fetch(player.id).catch(() => null);

      if (member && TIER_ROLES[gamemode]) {
        const allGamemodeRoleIds = Object.values(TIER_ROLES[gamemode]);
        const rolesToRemove = member.roles.cache.filter(role => allGamemodeRoleIds.includes(role.id));
        if (rolesToRemove.size > 0) {
          await member.roles.remove(rolesToRemove).catch(console.error);
        }

        const newRoleId = TIER_ROLES[gamemode][rankEarned];
        if (newRoleId) {
          const roleToAdd = interaction.guild.roles.cache.get(newRoleId);
          if (roleToAdd) {
            await member.roles.add(roleToAdd).catch(console.error);
          }
        }
      }

      // Message balasan langsung dikirim via index.js (Ephemeral / Rahasia)
      await interaction.editReply({
        content: `✅ Hasil tes **${username}** (${gamemode} - ${rankEarned}) berhasil disimpan ke Database dan Role Discord telah diperbarui!`
      }).catch(console.error);

    } catch (err) {
      console.error('❌ Error executing command:', err);
      await interaction.editReply({
        content: `❌ Error: ${err.message || 'Gagal memproses hasil test.'}`
      }).catch(console.error);
    }
  }

  if (interaction.commandName === 'setup') {
    await interaction.reply({
      content: '⚙️ Setup command executed successfully!',
      flags: MessageFlags.Ephemeral
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
