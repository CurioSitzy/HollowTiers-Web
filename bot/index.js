import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Event: Bot Online
client.once('ready', async (readyClient) => {
    console.log(`✅ Bot successfully logged in as ${readyClient.user.tag}`);

    // --- SYNC COMMAND AMAN (Mencegah command lain terhapus) ---
    try {
        const token = process.env.DISCORD_TOKEN;
        const clientId = process.env.CLIENT_ID || readyClient.user.id;
        const guildId = process.env.GUILD_ID;

        if (clientId) {
            const rest = new REST({ version: '10' }).setToken(token);
            const route = guildId 
                ? Routes.applicationGuildCommands(clientId, guildId) 
                : Routes.applicationCommands(clientId);

            // 1. Ambil daftar command yang sudah terdaftar di Discord saat ini
            const existingCommands = await rest.get(route);

            // 2. Definisi command /testresult milik web
            const testResultCommand = {
                name: 'testresult',
                description: 'Submit or view test result',
                options: [] // Tambahkan options jika command /testresult butuh parameter
            };

            // 3. Gabungkan: Pertahankan command lama, timpa/tambah /testresult saja
            const updatedCommands = existingCommands.filter(cmd => cmd.name !== 'testresult');
            updatedCommands.push(testResultCommand);

            // 4. Update ke Discord
            await rest.put(route, { body: updatedCommands });
            console.log('✅ Synchronized /testresult safely without removing existing commands!');
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
        await command.execute(interaction, client);
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
