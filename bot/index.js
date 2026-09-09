import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Warning: Supabase credentials missing in environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// 3. Load File Commands Otomatis dari Folder bot/commands
const loadCommands = async () => {
    const commandsPath = path.join(process.cwd(), 'bot', 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(`file://${filePath}`);
            
            const cmdData = command.default || command;
            if (cmdData && cmdData.data) {
                client.commands.set(cmdData.data.name, cmdData);
            }
        }
    }
};

// Event: Bot Online
client.once('ready', async (readyClient) => {
    console.log(`✅ Bot successfully logged in as ${readyClient.user.tag}`);

    // Load command local ke memori bot
    await loadCommands();

    // 4. Safe Sync: Ambil command bot utama, timpa /testresult saja, lalu upload ulang
    try {
        const token = process.env.DISCORD_TOKEN;
        const clientId = process.env.CLIENT_ID || readyClient.user.id;
        const guildId = process.env.GUILD_ID;

        if (clientId) {
            const rest = new REST({ version: '10' }).setToken(token);
            const route = guildId 
                ? Routes.applicationGuildCommands(clientId, guildId) 
                : Routes.applicationCommands(clientId);

            // Fetch semua command yang ada di server/bot saat ini
            const existingCommands = await rest.get(route);

            // Ambil daftar command lokal di repo web ini
            const localCommands = Array.from(client.commands.values()).map(cmd => 
                cmd.data.toJSON ? cmd.data.toJSON() : cmd.data
            );

            // Merge Map: pertahankan command lama, timpa jika namanya sama (/testresult)
            const mergedMap = new Map();
            existingCommands.forEach(cmd => mergedMap.set(cmd.name, cmd));
            localCommands.forEach(cmd => mergedMap.set(cmd.name, cmd));

            await rest.put(route, { body: Array.from(mergedMap.values()) });
            console.log('✅ Commands synchronized safely! /testresult updated without deleting other commands.');
        }
    } catch (err) {
        console.error('⚠️ Failed to sync commands safely:', err.message);
    }
});

// Event: Interaction Handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: 'Command not found.',
            ephemeral: true
        });
    }

    try {
        // Eksekusi command dan teruskan client + supabase instance
        await command.execute(interaction, client, supabase);
    } catch (error) {
        console.error(`Error executing /${interaction.commandName}:`, error);
        
        const errorMsg = { 
            content: 'There was an error while executing this command.', 
            ephemeral: true 
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMsg);
        } else {
            await interaction.reply(errorMsg);
        }
    }
});

// Login Bot
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('❌ DISCORD_TOKEN is missing in environment variables!');
    process.exit(1);
}

client.login(token);
