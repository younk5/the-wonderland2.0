const { EmbedBuilder } = require('discord.js');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');

module.exports = {
    id: 'select_product',
    async execute(interaction, client) {
        try {
            await interaction.deferUpdate();

            const productId = interaction.values[0];
            const product = await Product.findById(productId);

            if (!product) {
                return await interaction.editReply({
                    content: 'Produto não encontrado.',
                    ephemeral: true
                });
            }

            let cart = await Cart.findOne({ userId: interaction.user.id });
            if (!cart) {
                cart = new Cart({ userId: interaction.user.id, items: [], total: 0, discount: 0 });
            }

            const existingItemIndex = cart.items.findIndex(item => 
                item && item.itemId && item.itemId.toString() === productId
            );

            if (existingItemIndex !== -1) {
                cart.items[existingItemIndex].quantity += 1;
            } else {
                cart.items.push({
                    itemId: product._id,
                    quantity: 1,
                    price: product.price,
                    name: product.name
                });
            }

            cart.items = cart.items.filter(item => item && item.itemId);

            cart.total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            const finalTotal = cart.couponApplied ? cart.total - cart.discount : cart.total;

            await cart.save();

            const cartEmbed = new EmbedBuilder()
                .setTitle('Seu Carrinho')
                .setFields(
                    { name: 'Subtotal', value: `R$ ${cart.total.toFixed(2)}`, inline: true },
                    { name: 'Desconto', value: `R$ ${cart.discount.toFixed(2)}`, inline: true },
                    { name: 'Total Final', value: `R$ ${finalTotal.toFixed(2)}`, inline: true }
                )
                .setColor('#0099ff');

            const description = cart.items.map(item => {
                const itemName = item.name || 'Produto sem nome';
                return `${itemName} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`;
            }).join('\n');

            cartEmbed.setDescription(description || 'Seu carrinho está vazio.');

            await interaction.followUp({ 
                content: `${product.name} adicionado ao carrinho!`,
                embeds: [cartEmbed], 
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in select_product interaction:', error);
            
            const errorMessage = 'Ocorreu um erro ao processar sua seleção. Por favor, tente novamente mais tarde.';
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
            }
        }
    }
};