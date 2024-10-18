async function updateLeaderboard(guild, client) {
    const leaderboardChannel = await guild.channels.fetch(client.config.leaderboardChannel);
    if (!leaderboardChannel) return;

    const stats = await StaffStats.find({ guildId: guild.id })
        .sort({ ticketsClosed: -1 })
        .limit(3);

    if (stats.length === 0) return;

    const embed = new EmbedBuilder()
        .setTitle('🏆 Pódio de Atendimentos')
        .setDescription('Top 3 staffs com mais tickets atendidos')
        .setColor(client.config.colors.primary)
        .setTimestamp();

    const medals = ['🥇', '🥈', '🥉'];
    
    stats.forEach((stat, index) => {
        embed.addFields({
            name: `${medals[index]} ${stat.username}`,
            value: `Tickets Fechados: ${stat.ticketsClosed}\nTickets Assumidos: ${stat.ticketsHandled}`
        });
    });

    const messages = await leaderboardChannel.messages.fetch({ limit: 10 });
    const leaderboardMsg = messages.find(m => m.author.id === client.user.id);

    if (leaderboardMsg) {
        await leaderboardMsg.edit({ embeds: [embed] });
    } else {
        await leaderboardChannel.send({ embeds: [embed] });
    }
}

module.exports = updateLeaderboard;