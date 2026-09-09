import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands, registerCommands } from './handlers/loaders/commandLoader.js';
import { logger } from './utils/logger.js';
import botConfig from './config/bot.js';

// Inisialisasi Client Discord
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
        logger.info('Starting bot setup...');

        // 1. Load semua commands dari folder handlers lokal (/bot/handlers/loaders/commandLoader.js)
        await loadCommands(client);

        // 2. Event saat bot siap
        client.once('ready', async (readyClient) => {
            logger.info(`Bot ready! Logged in as ${readyClient.user.tag}`);

            try {
                const clientId = botConfig.bot?.clientId || process.env.CLIENT_ID;
                await registerCommands(client, { clientId });
            } catch (regError) {
                logger.error('Failed to register slash commands:', regError);
            }
        });

        // 3. Handling Interaksi Command
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`Command /${interaction.commandName} not found.`);
                return interaction.reply({
                    content: 'Command tidak ditemukan.',
                    ephemeral: true
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                logger.error(`Error executing /${interaction.commandName}:`, error);

                const errPayload = {
                    content: 'Terjadi error saat menjalankan command.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errPayload);
                } else {
                    await interaction.reply(errPayload);
                }
            }
        });

        // 4. Login Bot
        const token = botConfig.bot?.token || process.env.DISCORD_TOKEN;
        await client.login(token);

    } catch (error) {
        logger.error('Fatal error during startup:', error);
        process.exit(1);
    }
}

bootstrap();
