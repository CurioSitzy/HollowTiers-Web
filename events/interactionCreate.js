import { 
  Events, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';

// ==========================================
// CONFIGURATION ROLE ID DISCORD
// ==========================================
const REGION_ROLES = {
  AS: '1500479159456235533',
  EU: '1500479159456235535',
  NA: '1500479159456235534',
  AU: '1500479159456235532',
  SA: '1547158919649165413',
};

const TYPE_ROLES = {
  PREMIUM: '1546348570293051444',
  CRACKED: '1546348575406166106',
};

// Waitlist Role IDs per Gamemode
const WAITLIST_ROLES = {
  crystal: '1546415409618485328',
  sword: '1546413861387898903',
  mace: '1546412993758236832',
  axe: '1546413949552164884',
  uhc: '1546413321228656720',
  pot: '1546414095819997215',
  nethop: '1546413523716931694',
  smp: '1546413431089791027',
  cart: '1546413989196472373',
  diasmp: '1546413278195093545',
  spearmace: '1546413406918152223',
};

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client, supabase) {
    const db = supabase || client?.supabase;

    try {
      // ==========================================
      // 1. HANDLER SLASH COMMANDS
      // ==========================================
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return await interaction.reply({
            content: '❌ Command not found.',
            ephemeral: true,
          });
        }

        await command.execute(interaction, client, db);
        return;
      }

      // ==========================================
      // 2. HANDLER BUTTON INTERACTION
      // ==========================================
      if (interaction.isButton()) {
        const customId = interaction.customId;

        // A. TOMBOL VERIFY (waitlist_verify)
        if (customId === 'waitlist_verify') {
          const modal = new ModalBuilder()
            .setCustomId('modal_verify_form:global')
            .setTitle('Player Verification');

          const ignInput = new TextInputBuilder()
            .setCustomId('verify_ign')
            .setLabel('In-Game Name (Minecraft Username)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Player123')
            .setRequired(true);

          const regionInput = new TextInputBuilder()
            .setCustomId('verify_region')
            .setLabel('Region (AS / EU / NA / AU / SA)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. AS')
            .setRequired(true);

          const typeInput = new TextInputBuilder()
            .setCustomId('verify_type')
            .setLabel('Account Type (Cracked / Premium)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Premium')
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(ignInput),
            new ActionRowBuilder().addComponents(regionInput),
            new ActionRowBuilder().addComponents(typeInput)
          );

          return await interaction.showModal(modal);
        }

        // B. TOMBOL GAMEMODE (gm_crystal, gm_sword, dll)
        if (customId.startsWith('gm_')) {
          await interaction.deferReply({ ephemeral: true }).catch(() => {});

          try {
            const modeKey = customId.split('_')[1];
            const targetWaitlistRole = WAITLIST_ROLES[modeKey];

            if (!targetWaitlistRole) {
              return await interaction.editReply({
                content: `❌ Role ID untuk mode **${modeKey.toUpperCase()}** tidak ditemukan!`
              });
            }

            const member = interaction.member;
            if (!member) {
              return await interaction.editReply({ content: '❌ Data member tidak ditemukan di server.' });
            }

            const hasRole = member.roles.cache.has(targetWaitlistRole);

            if (hasRole) {
              await member.roles.remove(targetWaitlistRole);
              return await interaction.editReply({
                content: `➖ Role waitlist **${modeKey.toUpperCase()}** berhasil dihapus dari profilmu.`
              });
            } else {
              await member.roles.add(targetWaitlistRole);
              return await interaction.editReply({
                content: `✅ Berhasil bergabung ke waitlist **${modeKey.toUpperCase()}**! Role telah ditambahkan.`
              });
            }
          } catch (err) {
            console.error(`Error in gamemode button: ${err.message}`);
            return await interaction.editReply({
              content: `⚠️ Gagal mengubah role: \`${err.message}\`. Pastikan role bot berada di posisi paling atas!`
            });
          }
        }
        return;
      }

      // ==========================================
      // 3. HANDLER MODAL SUBMIT (VERIFIKASI & SYNC SUPABASE)
      // ==========================================
      if (interaction.isModalSubmit()) {
        const customId = interaction.customId;

        if (customId.startsWith('modal_verify_form')) {
          await interaction.deferReply({ ephemeral: true }).catch(() => {});

          try {
            const ign = interaction.fields.getTextInputValue('verify_ign').trim();
            const region = interaction.fields.getTextInputValue('verify_region').trim().toUpperCase();
            const type = interaction.fields.getTextInputValue('verify_type').trim().toUpperCase();

            let dbSynced = false;
            let nicknameUpdated = true;

            // ----------------------------------------------------
            // A. UPDATE / SYNC KE SUPABASE DATABASE
            // ----------------------------------------------------
            if (db) {
              const { error: dbError } = await db
                .from('players') // Sesuaikan nama tabel dengan yang ada di Supabase Dashboard kamu
                .upsert({
                  discord_id: interaction.user.id,
                  username: interaction.user.username,
                  ign: ign,
                  region: region,
                  account_type: type,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'discord_id' });

              if (dbError) {
                console.error(`❌ Gagal menyimpan ke Supabase untuk ${interaction.user.tag}:`, dbError);
              } else {
                dbSynced = true;
                console.log(`✅ Berhasil Sync Supabase untuk ${interaction.user.tag} [${ign}]`);
              }
            } else {
              console.warn('⚠️ Instance Supabase tidak tersedia!');
            }

            // ----------------------------------------------------
            // B. UPDATE NICKNAME DISCORD
            // ----------------------------------------------------
            try {
              if (interaction.guild && interaction.member) {
                await interaction.member.setNickname(`${ign} [${region}]`);
              }
            } catch (err) {
              nicknameUpdated = false;
              console.warn(`Gagal mengubah nickname untuk ${interaction.user.tag}: ${err.message}`);
            }

            // ----------------------------------------------------
            // C. UPDATE ROLES DISCORD
            // ----------------------------------------------------
            if (interaction.guild && interaction.member) {
              const allRegionRoleIds = Object.values(REGION_ROLES);
              const allTypeRoleIds = Object.values(TYPE_ROLES);

              const oldRolesToRemove = interaction.member.roles.cache
                .filter(role => allRegionRoleIds.includes(role.id) || allTypeRoleIds.includes(role.id))
                .map(role => role.id);

              if (oldRolesToRemove.length > 0) {
                await interaction.member.roles.remove(oldRolesToRemove).catch(() => {});
              }

              const rolesToAdd = [];
              if (REGION_ROLES[region]) rolesToAdd.push(REGION_ROLES[region]);
              if (TYPE_ROLES[type]) rolesToAdd.push(TYPE_ROLES[type]);

              if (rolesToAdd.length > 0) {
                await interaction.member.roles.add(rolesToAdd).catch(() => {});
              }
            }

            // ----------------------------------------------------
            // D. KIRIM EMBED RESPONS KE PLAYER
            // ----------------------------------------------------
            const successEmbed = new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle('✅ Verification Saved!')
              .setDescription(
                `**IGN:** \`${ign}\`\n` +
                `**Region:** \`${region}\`\n` +
                `**Type:** \`${type}\`\n\n` +
                (dbSynced ? '🌐 **Status Web:** Data berhasil disinkronkan ke Tierlist Website & Database!\n' : '⚠️ **Status Web:** Gagal menyimpan ke database.\n') +
                (nicknameUpdated ? '' : '⚠️ *Catatan: Nickname Discord tidak bisa diubah karena role hierarchy.*')
              );

            return await interaction.editReply({
              embeds: [successEmbed]
            });

          } catch (submitErr) {
            console.error('Error saat submit modal verifikasi:', submitErr);
            return await interaction.editReply({
              content: '❌ Terjadi kesalahan saat memproses verifikasi. Silakan coba lagi.'
            });
          }
        }
        return;
      }

    } catch (error) {
      console.error('Unhandled error in interactionCreate:', error);
    }
  }
};
