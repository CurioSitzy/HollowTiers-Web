import { Client, GatewayIntentBits, Collection } from 'discord.js';

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
client.once('ready', (readyClient) => {
    console.log(`✅ Bot successfully logged in as ${readyClient.user.tag}`);
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
