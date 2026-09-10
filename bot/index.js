import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';

// Import command & handler (naik 1 folder ke ../events/ karena index.js ada di dalam /bot/)
import testresultCommand from './commands/testresult.js';
import interactionCreateHandler from '../events/interactionCreate.js';

// 1. Inisialisasi Supabase Client
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Warning: Supabase credentials missing in environment variables!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. Inisialisasi Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Simpan instance ke client
client.supabase = supabase;
client.commands = new Collection();
client.cooldowns = new Collection();

// 3. Register Command ke Memory
if (testresultCommand && testresultCommand.data) {
  client.commands.set(testresultCommand.data.name, testresultCommand);
}

// Event: Bot Online
client.once('ready', async (readyClient) => {
  console.log(`✅ Bot successfully logged in as ${readyClient.user.tag}`);

  // 4. Synchronize Slash Commands dengan Discord API
  try {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID || readyClient.user.id;
    const guildId = process.env.GUILD_ID;

    if (clientId) {
      const rest = new REST({ version: '10' }).setToken(token);
      const route = guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId);

      const existingCommands = await rest.get(route);

      const localCommands = Array.from(client.commands.values()).map((cmd) =>
        cmd.data.toJSON ? cmd.data.toJSON() : cmd.data
      );

      const mergedMap = new Map();
      existingCommands.forEach((cmd) => mergedMap.set(cmd.name, cmd));
      localCommands.forEach((cmd) => mergedMap.set(cmd.name, cmd));

      await rest.put(route, { body: Array.from(mergedMap.values()) });
      console.log('✅ Commands synchronized safely!');
    }
  } catch (err) {
    console.error('⚠️ Failed to sync commands safely:', err.message);
  }
});

// ==========================================
// 5. EVENT INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async (interaction) => {
  try {
    // Eksekusi handler utama dari ../events/interactionCreate.js
    await interactionCreateHandler.execute(interaction, client, supabase);
  } catch (error) {
    console.error('❌ Error handling interaction event:', error);
  }
});

// Login Bot
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ DISCORD_TOKEN is missing in environment variables!');
  process.exit(1);
}

client.login(token);
