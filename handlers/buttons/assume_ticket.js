const { PermissionFlagsBits } = require('discord.js');
const StaffStats = require('../../models/StaffStats'); 

module.exports = {
    id: 'assume_ticket',
    async execute(interaction, client) {
        if (!interaction.member.roles.cache.has(client.config.staffRole)) {
            return interaction.reply({ content: 'Você não tem permissão para assumir este ticket.', ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
            SendMessages: true,
            ViewChannel: true
        });

        try {
            await StaffStats.updateOne(
                { userId: interaction.user.id, guildId: interaction.guild.id },
                {
                    $setOnInsert: { username: interaction.user.username },
                    $inc: { ticketsHandled: 1 },
                    $currentDate: { lastTicketDate: true }
                },
                { upsert: true } 
            );

            await interaction.reply(`${interaction.user} assumiu este ticket e o registro foi atualizado.`);

        } catch (error) {
            console.error('Erro ao atualizar os dados do staff:', error);
            await interaction.reply({ content: 'Ocorreu um erro ao atualizar os dados do staff.', ephemeral: true });
        }
    }
};
