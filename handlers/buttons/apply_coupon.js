const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Coupon = require('../../models/Coupon');
const Cart = require('../../models/Cart');

module.exports = {
    id: 'apply_coupon',
    async execute(interaction, client) {
        const userId = interaction.user.id;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Aplicar Cupom')
            .setDescription('Clique no botão abaixo para aplicar um cupom ao seu carrinho.');

        const button = new ButtonBuilder()
            .setCustomId('enter_coupon')
            .setLabel('Inserir Cupom')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.customId === 'enter_coupon' && i.user.id === userId;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.reply({ content: 'Por favor, digite o código do cupom no chat.', ephemeral: true });

            const messageFilter = m => m.author.id === userId;
            const messageCollector = i.channel.createMessageCollector({ filter: messageFilter, time: 30000, max: 1 });

            messageCollector.on('collect', async message => {
                const couponCode = message.content.trim();

                try {
                    const coupon = await Coupon.findOne({ code: couponCode });

                    if (coupon) {
                        const userCart = await Cart.findOne({ userId: userId });

                        if (!userCart) {
                            await i.followUp({ content: 'Você não tem um carrinho ativo.', ephemeral: true });
                            return;
                        }

                        const discount = coupon.discount;
                        const newTotal = userCart.total * (1 - discount / 100);

                        userCart.total = newTotal;
                        userCart.appliedCoupon = couponCode;
                        await userCart.save();

                        const resultEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('Cupom Aplicado')
                            .setDescription(`O cupom ${couponCode} foi aplicado com sucesso!`)
                            .addFields(
                                { name: 'Desconto', value: `${discount}%`, inline: true },
                                { name: 'Total com desconto', value: `R$ ${newTotal.toFixed(2)}`, inline: true }
                            );

                        await i.followUp({ embeds: [resultEmbed], ephemeral: true });
                    } else {
                        await i.followUp({ content: 'Cupom inválido. Por favor, tente novamente.', ephemeral: true });
                    }
                } catch (error) {
                    console.error('Erro ao processar o cupom:', error);
                    await i.followUp({ content: 'Ocorreu um erro ao processar o cupom. Por favor, tente novamente mais tarde.', ephemeral: true });
                }
            });

            messageCollector.on('end', collected => {
                if (collected.size === 0) {
                    i.followUp({ content: 'Tempo esgotado. Por favor, tente aplicar o cupom novamente.', ephemeral: true });
                }
            });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Tempo esgotado. Por favor, tente aplicar o cupom novamente.', ephemeral: true });
            }
        });
    }
};
