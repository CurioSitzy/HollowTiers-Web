import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands, registerCommands } from '../src/handlers/loaders/commandLoader.js';
import { logger } from '../src/utils/logger.js';
import botConfig from '../src/config/bot.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.config = botConfig;

async function bootstrap() {
    try {
        logger.info('Initializing bot startup sequence...');

        // 1. Load all commands into memory from src directory
        await loadCommands(client);

        // 2. Handle bot ready event
        client.once('ready', async (readyClient) => {
            logger.info(`Successfully logged in as ${readyClient.user.tag}`);

            try {
                const clientId = botConfig.bot?.clientId || process.env.CLIENT_ID;
                await registerCommands(client, { clientId });
            } catch (regError) {
                logger.error('Failed to register global slash commands:', regError);
            }
        });

        // 3. Handle interaction events
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`Command /${interaction.commandName} was not found in memory.`);
                return interaction.reply({
                    content: 'This command is currently unavailable.',
                    ephemeral: true
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                logger.error(`Error executing command /${interaction.commandName}:`, error);

                const errorPayload = {
                    content: 'An error occurred while executing this command.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorPayload);
                } else {
                    await interaction.reply(errorPayload);
                }
            }
        });

        // 4. Authenticate bot
        const token = botConfig.bot?.token || process.env.DISCORD_TOKEN;
        await client.login(token);

    } catch (error) {
        logger.error('Fatal initialization error:', error);
        process.exit(1);
    }
}

bootstrap();
