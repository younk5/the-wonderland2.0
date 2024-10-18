const { SlashCommandBuilder } = require('discord.js');
const StaffStats = require('../../models/StaffStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addstaff')
        .setDescription('Adiciona um novo membro ao sistema de stats do staff.')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('ID do usuário que será adicionado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('guild_id')
                .setDescription('ID do servidor onde o usuário está')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Nome do usuário que será adicionado')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('tickets_closed')
                .setDescription('Quantidade de tickets fechados')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('tickets_handled')
                .setDescription('Quantidade de tickets tratados')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const userId = interaction.options.getString('user_id');
        const guildId = interaction.options.getString('guild_id');
        const username = interaction.options.getString('username');
        const ticketsClosed = interaction.options.getInteger('tickets_closed');
        const ticketsHandled = interaction.options.getInteger('tickets_handled');

        try {
            const newStats = new StaffStats({
                userId,
                guildId,
                username,
                ticketsClosed,
                ticketsHandled,
                lastTicketDate: null 
            });

            await newStats.save();

            await interaction.reply(`Stats do usuário <@${userId}> foram adicionados com sucesso!`);
        } catch (error) {
            console.error('Erro ao adicionar stats do staff:', error);
            await interaction.reply({ content: 'Ocorreu um erro ao adicionar os stats do staff.', ephemeral: true });
        }
    },
};
