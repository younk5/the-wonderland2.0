const { EmbedBuilder } = require('discord.js');
const Cart = require('../../models/Cart');

module.exports = {
    id: 'clear_cart',
    async execute(interaction, client) {
        await Cart.findOneAndDelete({ userId: interaction.user.id });

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setFields(
                { name: 'Total', value: 'R$ 0,00', inline: true },
                { name: 'Desconto', value: 'R$ 0,00', inline: true },
                { name: 'Total Final', value: 'R$ 0,00', inline: true }
            )
            .setDescription('Seu carrinho está vazio.');

        await interaction.update({ embeds: [embed] });
        await interaction.followUp({ content: 'Seu carrinho foi limpo.', ephemeral: false });
    }
};