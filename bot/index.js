import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands, registerCommands } from './handlers/loaders/commandLoader.js';
import { logger } from './utils/logger.js';
import botConfig from './config/bot.js';

// Initialize Client with required Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Setup Collection and Attach Config
client.commands = new Collection();
client.config = botConfig;

async function bootstrap() {
    try {
        logger.info('Initializing bot startup...');

        // 1. Load all commands recursively into memory first
        await loadCommands(client);

        // 2. Register ready event
        client.once('ready', async (readyClient) => {
            logger.info(`Logged in as ${readyClient.user.tag}`);

            // Register Slash Commands globally via Discord API
            try {
                const clientId = botConfig.bot?.clientId || process.env.CLIENT_ID;
                await registerCommands(client, { clientId });
            } catch (regError) {
                logger.error('Failed to register commands during startup:', regError);
            }
        });

        // 3. Handle Slash Command interactions
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`Command /${interaction.commandName} was not found in memory.`);
                return interaction.reply({
                    content: 'This command is unavailable or not registered.',
                    ephemeral: true
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                logger.error(`Error executing /${interaction.commandName}:`, error);

                const errorResponse = {
                    content: 'There was an error executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorResponse);
                } else {
                    await interaction.reply(errorResponse);
                }
            }
        });

        // 4. Authenticate and connect
        const token = botConfig.bot?.token || process.env.DISCORD_TOKEN;
        await client.login(token);

    } catch (error) {
        logger.error('Fatal error during bot initialization:', error);
        process.exit(1);
    }
}

bootstrap();
