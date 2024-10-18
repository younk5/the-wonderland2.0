const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../models/Ticket');
const Cart = require('../../models/Cart');  

module.exports = {
    id: 'create_ticket',
    async execute(interaction, client) {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: client.config.ticketCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: client.config.staffRole,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                }
            ]
        });

        const ticket = new Ticket({
            userId: interaction.user.id,
            channelId: channel.id,
            guildId: interaction.guild.id
        });
        await ticket.save();

        const calculateCartTotal = async (userId) => {
            const cart = await Cart.findOne({ userId });
            let total = 0;

            if (cart && cart.items.length > 0) {
                cart.items.forEach(item => {
                    total += item.price * item.quantity;
                });
            }
            return total;
        };

        let total = await calculateCartTotal(interaction.user.id);
        let embed = new EmbedBuilder()
            .setTitle('🛒 Seu Carrinho')
            .setDescription('Selecione os produtos que deseja comprar usando o menu abaixo.')
            .setColor(client.config.colors.primary)
            .addFields(
                { name: 'Total', value: `R$ ${total.toFixed(2)}`, inline: true },
                { name: 'Desconto', value: 'R$ 0,00', inline: true },
                { name: 'Total Final', value: `R$ ${total.toFixed(2)}`, inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('add_product')
                    .setLabel('Adicionar Produto')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('apply_coupon')
                    .setLabel('Aplicar Cupom')
                    .setEmoji('🎟️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('clear_cart')
                    .setLabel('Limpar Carrinho')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('finish_purchase')
                    .setLabel('Finalizar Compra')
                    .setEmoji('💰')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('assume_ticket')
                    .setLabel('Assumir Ticket')
                    .setEmoji('👋')
                    .setStyle(ButtonStyle.Success),
            );

        const sentMessage = await channel.send({
            content: `Bem-vindo ${interaction.user}! Este é seu ticket de compra.`,
            embeds: [embed],
            components: [row]
        });

        const updateEmbed = async () => {
            total = await calculateCartTotal(interaction.user.id);

            embed = EmbedBuilder.from(embed)
                .spliceFields(0, 3, [
                    { name: 'Total', value: `R$ ${total.toFixed(2)}`, inline: true },
                    { name: 'Desconto', value: 'R$ 0,00', inline: true },
                    { name: 'Total Final', value: `R$ ${total.toFixed(2)}`, inline: true }
                ]);

            await sentMessage.edit({ embeds: [embed] });
        };

        const collector = channel.createMessageComponentCollector({
            componentType: 'BUTTON',
            time: 60000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'add_product' && i.user.id === interaction.user.id) {
                const cart = await Cart.findOneAndUpdate(
                    { userId: interaction.user.id },
                    { $push: { items: { name: 'Produto Exemplo', price: 10, quantity: 1 } } },
                    { new: true, upsert: true }
                );

                await i.reply({ content: 'Produto adicionado!', ephemeral: true });

                await updateEmbed();
            }
        });

        await interaction.reply({
            content: `Ticket criado com sucesso! ${channel}`,
            ephemeral: true
        });
    }
};
