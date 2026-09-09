require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection, MessageFlags } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Collection to store commands
client.commands = new Collection();
const commandsArray = [];

// ==========================================
// COMMAND AUTO-LOADER (Reads all files in 'commands' folder)
// ==========================================
const commandsPath = path.join(__dirname, 'commands');

// Create 'commands' directory if it doesn't exist
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  delete require.cache[require.resolve(filePath)]; 
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commandsArray.push(command.data.toJSON());
    console.log(`🔹 Loaded Command: /${command.data.name}`);
  } else {
    console.log(`⚠️ Warning: Command at ${filePath} is missing "data" or "execute" property.`);
  }
}

// ==========================================
// SAFE REGISTER COMMANDS (PATCH/POST ONLY - NO OVERWRITE)
// ==========================================
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Syncing ${commandsArray.length} Slash Commands without overwriting existing ones...`);

    // 1. Fetch current active commands from Discord API
    const currentCommands = await rest.get(
      Routes.applicationCommands(client.user.id)
    );

    // 2. Loop through each command loaded in web and sync individually
    for (const cmdData of commandsArray) {
      const existingCmd = currentCommands.find(c => c.name === cmdData.name);

      if (existingCmd) {
        // Update ONLY this command using its specific Command ID
        await rest.patch(
          Routes.applicationCommand(client.user.id, existingCmd.id),
          { body: cmdData }
        );
        console.log(`✅ Successfully updated /${cmdData.name} (PATCH)`);
      } else {
        // Add new command without affecting other registered commands
        await rest.post(
          Routes.applicationCommands(client.user.id),
          { body: cmdData }
        );
        console.log(`✅ Successfully registered /${cmdData.name} (POST)`);
      }
    }

    console.log('✅ Command sync completed safely!');
  } catch (err) {
    console.error('❌ Failed to sync Slash Commands:', err);
  }
}

// Ready Event
client.once('ready', async () => {
  console.log(`🤖 HollowTiers Bot is online as ${client.user.tag}`);
  await registerCommands();
});

// ==========================================
// INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching /${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, { supabase });
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: '❌ There was an error while executing this command!' }).catch(() => null);
    } else {
      await interaction.reply({ content: '❌ There was an error while executing this command!', flags: MessageFlags.Ephemeral }).catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
