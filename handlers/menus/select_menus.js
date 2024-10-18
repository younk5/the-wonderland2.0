const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

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
        .setCustomId('select-channel')
        .setPlaceholder('Selecione um canal para mover')
        .addOptions(channelOptions);

    const row = new ActionRowBuilder().addComponents(channelSelect);

    await interaction.update({ components: [row] });
};

const handleChannelSelect = async (interaction, client) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: 'Você não tem permissão para mover canais.',
            ephemeral: true
        });
    }

    const selectedChannelId = interaction.values[0];

    if (selectedChannelId === 'update_list') {
        return updateChannelList(interaction);
    }

    const categories = interaction.guild.channels.cache.filter(channel => channel.type === 4);

    const categoryOptions = categories.map(category => 
        new StringSelectMenuOptionBuilder()
            .setLabel(category.name)
            .setDescription(`ID: ${category.id}`)
            .setValue(category.id)
    );

    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('select-category')
        .setPlaceholder('Selecione uma categoria')
        .addOptions(categoryOptions);

    const row = new ActionRowBuilder().addComponents(categorySelect);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Selecionar Categoria')
        .setDescription(`Selecione a categoria para mover o canal <#${selectedChannelId}>`);

    await interaction.update({
        embeds: [embed],
        components: [row],
    });

    client.selectedChannelId = selectedChannelId;
};

const handleCategorySelect = async (interaction, client) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: 'Você não tem permissão para mover canais.',
            ephemeral: true
        });
    }

    const selectedCategoryId = interaction.values[0];
    const selectedChannelId = client.selectedChannelId;

    const channel = await interaction.guild.channels.fetch(selectedChannelId);
    const category = await interaction.guild.channels.fetch(selectedCategoryId);

    if (channel && category) {
        await channel.setParent(category.id);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Canal Movido')
            .setDescription(`O canal <#${selectedChannelId}> foi movido para a categoria "${category.name}".`);

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('select-channel')
            .setPlaceholder('Selecione um canal para mover')
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
            content: `Você moveu o canal <#${selectedChannelId}> para a categoria "${category.name}".`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: 'Ocorreu um erro ao mover o canal. Por favor, tente novamente.',
            ephemeral: true
        });
    }
};

module.exports = {
    'select-channel': {
        execute: handleChannelSelect
    },
    'select-category': {
        execute: handleCategorySelect
    }
};