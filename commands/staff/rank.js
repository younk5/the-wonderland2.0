const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StaffStats = require('../../models/StaffStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Mostra os stats de um membro.')
        .addUserOption(option => option.setName('user').setDescription('O usuário para mostrar os stats')),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;  

        try {
            const staffStats = await StaffStats.findOne({
                userId: user.id,
                guildId: interaction.guild.id
            });

            if (!staffStats) {
                return await interaction.reply({ content: `Nenhum registro encontrado para ${user.username}.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Stats de ${staffStats.username}`)
                .addFields(
                    { name: 'Tickets Atendidos', value: `${staffStats.ticketsHandled}`, inline: true },
                    { name: 'Tickets Fechados', value: `${staffStats.ticketsClosed}`, inline: true },
                    { name: 'Último Ticket Assumido', value: staffStats.lastTicketDate ? staffStats.lastTicketDate.toLocaleString() : 'Nunca', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao buscar os stats:', error);
            await interaction.reply({ content: 'Ocorreu um erro ao buscar os stats.', ephemeral: true });
        }
    }
};
