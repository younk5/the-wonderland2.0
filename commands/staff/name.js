const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurarmudarnome')
        .setDescription('Cria um embed fixo para mudar nomes de canais (apenas para o dono do servidor)')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde o embed será enviado')
                .setRequired(true)),

    async execute(interaction, client) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'Apenas o dono do servidor pode usar este comando.',
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('canal');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Mudar Nome de Canal')
            .setDescription('Use o menu abaixo para selecionar um canal para renomear.');

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('select-channel-rename')
            .setPlaceholder('Selecione um canal para renomear')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Atualizar lista')
                    .setDescription('Atualiza a lista de canais')
                    .setValue('update_list')
            );

        const row = new ActionRowBuilder().addComponents(channelSelect);

        const message = await channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `Embed para mudar nomes de canais criado com sucesso em ${channel}.`,
            ephemeral: true
        });
    },
};