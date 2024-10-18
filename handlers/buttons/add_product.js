const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
    id: 'add_product',
    async execute(interaction, client) {
        try {
            const products = await Product.find({ inStock: true });

            if (products.length === 0) {
                return await interaction.reply({
                    content: 'Não há produtos disponíveis no momento.',
                    ephemeral: true
                });
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_product')
                        .setPlaceholder('Selecione um produto')
                        .addOptions(
                            products.map(product => ({
                                label: product.name,
                                description: `R$ ${product.price.toFixed(2)}`,
                                value: product._id.toString()
                            }))
                        )
                );

            await interaction.reply({
                content: 'Selecione o produto que deseja adicionar ao carrinho:',
                components: [row],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in add_product interaction:', error);
            await interaction.reply({
                content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.',
                ephemeral: true
            }).catch(console.error);
        }
    }
};