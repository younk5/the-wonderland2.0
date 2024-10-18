const Ticket = require('../../models/Ticket');

module.exports = {
    id: 'close_ticket',
    async execute(interaction, client) {
        if (!interaction.member.roles.cache.has(client.config.staffRole)) {
            return interaction.reply({ content: 'Você não tem permissão para fechar este ticket.', ephemeral: true });
        }

        await Ticket.findOneAndDelete({ channelId: interaction.channel.id });
        await interaction.reply('Este ticket será fechado em 5 segundos.');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
};