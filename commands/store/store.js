const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('store')
        .setDescription('Cria um painel da loja')
        .setDefaultMemberPermissions('0'), 

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🏪 Loja do Servidor')
            .setDescription('Bem-vindo à nossa loja! Clique no botão abaixo para abrir um ticket de compra.')
            .setColor(client.config.colors.primary)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Abrir Ticket')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};