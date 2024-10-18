const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StaffStats = require('../../models/StaffStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Mostra os 5 staffs com mais tickets atendidos.'),

    async execute(interaction) {
        try {
            const topStaffs = await StaffStats.find({ guildId: interaction.guild.id })
                .sort({ ticketsHandled: -1 }) 
                .limit(5); 

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Top 5 Staffs')
                .setDescription('Aqui estão os 5 staffs com mais tickets atendidos:')
                .setTimestamp();

            topStaffs.forEach((staff, index) => {
                embed.addFields(
                    { name: `${index + 1}. ${staff.username}`, value: `Tickets Atendidos: ${staff.ticketsHandled}`, inline: false }
                );
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao buscar o ranking:', error);
            await interaction.reply({ content: 'Ocorreu um erro ao buscar o ranking.', ephemeral: true });
        }
    }
};
