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
// REGISTER ALL COMMANDS TO DISCORD API
// ==========================================
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Deploying ${commandsArray.length} Slash Commands...`);
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsArray }
    );
    
    console.log('✅ All Slash Commands successfully registered without overwriting!');
  } catch (err) {
    console.error('❌ Failed to register Slash Commands:', err);
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
