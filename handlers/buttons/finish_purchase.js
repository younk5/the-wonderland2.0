const { PermissionsBitField } = require('discord.js');
const Cart = require('../../models/Cart');

module.exports = {
    id: 'finish_purchase',
    async execute(interaction, client) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return await interaction.reply({ 
                    content: 'Você não tem permissão para finalizar compras. Apenas membros da equipe podem usar este comando.', 
                    ephemeral: true 
                });
            }

            await interaction.reply({ 
                content: 'Compra finalizada com sucesso! Obrigado por sua compra.', 
                ephemeral: true 
            });
        
            await Cart.findOneAndDelete({ userId: interaction.user.id });

            const channel = interaction.channel;
            if (channel) {
                try {
                    await channel.delete(); 
                } catch (error) {
                    console.error(`Erro ao excluir o canal: ${error}`);
                    await interaction.followUp({ 
                        content: 'A compra foi processada, mas houve um erro ao excluir o canal.', 
                        ephemeral: true 
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao finalizar a compra:', error);
            await interaction.reply({ 
                content: 'Ocorreu um erro ao processar a compra. Por favor, tente novamente mais tarde ou contacte um administrador.', 
                ephemeral: true 
            });
        }
    }
};