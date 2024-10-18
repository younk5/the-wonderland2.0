const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Coupon = require('../../models/Coupon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coupon')
        .setDescription('Gerenciar cupons da loja')
        .setDefaultMemberPermissions('0')  
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adicionar um novo cupom')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Código do cupom')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('discount')
                        .setDescription('Porcentagem de desconto')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .addStringOption(option =>
                    option.setName('expires')
                        .setDescription('Data de expiração (DD/MM/YYYY)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Limite de usos (0 para ilimitado)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remover um cupom')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Código do cupom')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Editar um cupom')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Código do cupom')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('discount')
                        .setDescription('Nova porcentagem de desconto'))
                .addStringOption(option =>
                    option.setName('expires')
                        .setDescription('Nova data de expiração (DD/MM/YYYY)'))
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Novo limite de usos (0 para ilimitado)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Listar todos os cupons')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                return await handleAddCoupon(interaction);
            case 'remove':
                return await handleRemoveCoupon(interaction);
            case 'edit':
                return await handleEditCoupon(interaction);
            case 'list':
                return await handleListCoupons(interaction);
        }
    }
};

async function handleAddCoupon(interaction) {
    const code = interaction.options.getString('code').toUpperCase();
    const discount = interaction.options.getNumber('discount');
    const expiresStr = interaction.options.getString('expires');
    const limit = interaction.options.getInteger('limit') ?? 0;

    const [day, month, year] = expiresStr.split('/');
    const expires = new Date(year, month - 1, day);
    
    if (expires < new Date()) {
        return await interaction.reply({
            content: 'A data de expiração deve ser futura!',
            ephemeral: true
        });
    }

    try {
        const coupon = new Coupon({
            code,
            discount,
            validUntil: expires,
            usageLimit: limit
        });

        await coupon.save();

        const embed = new EmbedBuilder()
            .setTitle('✅ Cupom Criado')
            .setDescription(`Cupom ${code} criado com sucesso!`)
            .addFields(
                { name: 'Desconto', value: `${discount}%`, inline: true },
                { name: 'Expira em', value: expires.toLocaleDateString(), inline: true },
                { name: 'Limite de Usos', value: limit === 0 ? 'Ilimitado' : limit.toString(), inline: true }
            )
            .setColor('Green');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        if (error.code === 11000) {  
            return await interaction.reply({
                content: 'Este código de cupom já existe!',
                ephemeral: true
            });
        }
        throw error;
    }
}

async function handleRemoveCoupon(interaction) {
    const code = interaction.options.getString('code').toUpperCase();

    const coupon = await Coupon.findOneAndDelete({ code });

    if (!coupon) {
        return await interaction.reply({
            content: 'Cupom não encontrado!',
            ephemeral: true
        });
    }

    await interaction.reply({
        content: `Cupom ${code} removido com sucesso!`,
        ephemeral: true
    });
}

async function handleEditCoupon(interaction) {
    const code = interaction.options.getString('code').toUpperCase();
    const discount = interaction.options.getNumber('discount');
    const expiresStr = interaction.options.getString('expires');
    const limit = interaction.options.getInteger('limit');

    const updateData = {};

    if (discount) updateData.discount = discount;
    
    if (expiresStr) {
        const [day, month, year] = expiresStr.split('/');
        const expires = new Date(year, month - 1, day);
        
        if (expires < new Date()) {
            return await interaction.reply({
                content: 'A data de expiração deve ser futura!',
                ephemeral: true
            });
        }
        
        updateData.validUntil = expires;
    }

    if (limit !== null) updateData.usageLimit = limit;

    const coupon = await Coupon.findOneAndUpdate(
        { code },
        updateData,
        { new: true }
    );

    if (!coupon) {
        return await interaction.reply({
            content: 'Cupom não encontrado!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('✅ Cupom Atualizado')
        .setDescription(`Cupom ${code} atualizado com sucesso!`)
        .addFields(
            { name: 'Desconto', value: `${coupon.discount}%`, inline: true },
            { name: 'Expira em', value: coupon.validUntil ? coupon.validUntil.toLocaleDateString() : 'N/A', inline: true },
            { name: 'Limite de Usos', value: coupon.usageLimit === 0 ? 'Ilimitado' : coupon.usageLimit.toString(), inline: true },
            { name: 'Usos Atuais', value: coupon.usedCount.toString(), inline: true }
        )
        .setColor('Blue');

    await interaction.reply({ embeds: [embed] });
}


async function handleListCoupons(interaction) {
    const coupons = await Coupon.find().sort({ validUntil: 1 });

    if (coupons.length === 0) {
        return await interaction.reply({
            content: 'Não há cupons cadastrados!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('🎟️ Lista de Cupons')
        .setDescription('Todos os cupons ativos no sistema')
        .setColor('Blue');

    coupons.forEach(coupon => {
        const isExpired = coupon.validUntil && coupon.validUntil < new Date();
        const isLimitReached = coupon.usageLimit !== 0 && coupon.usedCount >= coupon.usageLimit;
        const status = isExpired ? '🔴' : isLimitReached ? '🟡' : '🟢';
        const validUntil = coupon.validUntil ? coupon.validUntil.toLocaleDateString() : 'N/A';

        embed.addFields({
            name: `${status} ${coupon.code}`,
            value: `Desconto: ${coupon.discount}%\n` +
                  `Expira: ${validUntil}\n` +
                  `Usos: ${coupon.usedCount}/${coupon.usageLimit || '∞'}`
        });
    });

    await interaction.reply({ embeds: [embed] });
}
