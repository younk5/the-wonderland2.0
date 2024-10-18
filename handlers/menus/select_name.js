const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const updateChannelList = async (interaction) => {
    const guild = interaction.guild;
    const channels = guild.channels.cache.filter(channel => channel.type === 0);  

    const channelOptions = channels.map(channel => 
        new StringSelectMenuOptionBuilder()
            .setLabel(channel.name)
            .setDescription(`ID: ${channel.id}`)
            .setValue(channel.id)
    );

    channelOptions.unshift(
        new StringSelectMenuOptionBuilder()
            .setLabel('Atualizar lista')
            .setDescription('Atualiza a lista de canais')
            .setValue('update_list')
    );

    const channelSelect = new StringSelectMenuBuilder()
        .setCustomId('select-channel-rename')
        .setPlaceholder('Selecione um canal para renomear')
        .addOptions(channelOptions);

    const row = new ActionRowBuilder().addComponents(channelSelect);

    await interaction.update({ components: [row] });
};

const handleChannelSelect = async (interaction, client) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: 'Você não tem permissão para renomear canais.',
            ephemeral: true
        });
    }

    const selectedChannelId = interaction.values[0];

    if (selectedChannelId === 'update_list') {
        return updateChannelList(interaction);
    }

    const channel = await interaction.guild.channels.fetch(selectedChannelId);

    const modal = new ModalBuilder()
        .setCustomId(`rename-channel-${selectedChannelId}`)
        .setTitle(`Renomear Canal: ${channel.name}`);

    const newNameInput = new TextInputBuilder()
        .setCustomId('newChannelName')
        .setLabel("Novo nome do canal")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite o novo nome do canal')
        .setRequired(true)
        .setMaxLength(100);

    const actionRow = new ActionRowBuilder().addComponents(newNameInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
};

const handleRenameModal = async (interaction) => {
    const channelId = interaction.customId.split('-')[2];
    const newName = interaction.fields.getTextInputValue('newChannelName');

    const channel = await interaction.guild.channels.fetch(channelId);
    
    if (channel) {
        const oldName = channel.name;
        await channel.setName(newName);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Canal Renomeado')
            .setDescription(`O canal foi renomeado de "${oldName}" para "${newName}".`);

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

        await interaction.update({
            embeds: [embed],
            components: [row],
        });

        await interaction.followUp({
            content: `Você renomeou o canal de "${oldName}" para "${newName}".`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: 'Ocorreu um erro ao renomear o canal. Por favor, tente novamente.',
            ephemeral: true
        });
    }
};

module.exports = {
    'select-channel-rename': {
        execute: handleChannelSelect
    },
    handleRenameModal
};