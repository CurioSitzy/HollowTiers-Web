require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID; // Masukkan Client/Application ID bot kamu di .env
const GUILD_ID = process.env.DISCORD_GUILD_ID;   // ID Server Discord kamu

// Definisi Pilihan Gamemode LENGKAP termasuk Dia SMP
const GAMEMODE_CHOICES = [
  { name: 'Vanilla', value: 'Vanilla' },
  { name: 'Sword', value: 'Sword' },
  { name: 'Axe', value: 'Axe' },
  { name: 'UHC', value: 'UHC' },
  { name: 'SMP', value: 'SMP' },
  { name: 'Dia SMP', value: 'Diamond SMP' },
  { name: 'Pot', value: 'Pot' },
  { name: 'Netherite OP', value: 'Netherite OP' },
  { name: 'Cart', value: 'Cart' },
  { name: 'Spear Mace', value: 'Spear Mace' }
];

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
  { name: 'HT1', value: 'HT1' }
];

const REGION_CHOICES = [
  { name: 'NA', value: 'NA' },
  { name: 'EU', value: 'EU' },
  { name: 'AS', value: 'AS' },
  { name: 'AU', value: 'AU' },
  { name: 'SA', value: 'SA' }
];

const commands = [
  new SlashCommandBuilder()
    .setName('testresult')
    .setDescription('Submit player test result')
    .addUserOption(option => option.setName('player').setDescription('Player Discord').setRequired(true))
    .addUserOption(option => option.setName('tester').setDescription('Tester Discord').setRequired(true))
    .addStringOption(option => 
      option.setName('region')
        .setDescription('Player Region')
        .setRequired(true)
        .addChoices(...REGION_CHOICES)
    )
    .addStringOption(option => option.setName('username').setDescription('Minecraft IGN').setRequired(true))
    .addStringOption(option => 
      option.setName('gamemode')
        .setDescription('Select Gamemode')
        .setRequired(true)
        .addChoices(...GAMEMODE_CHOICES)
    )
    .addStringOption(option => 
      option.setName('previous_rank')
        .setDescription('Previous Rank')
        .setRequired(true)
        .addChoices(...RANK_CHOICES)
    )
    .addStringOption(option => 
      option.setName('rank_earned')
        .setDescription('Rank Earned')
        .setRequired(true)
        .addChoices(...RANK_CHOICES)
    ),
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup bot configuration')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registering Slash Commands to Discord...');

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log('✅ Commands registered successfully to Guild!');
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Global Commands registered successfully!');
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
