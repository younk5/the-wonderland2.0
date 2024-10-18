const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('product')
        .setDescription('Gerenciar produtos da loja')
        .setDefaultMemberPermissions('0') // Apenas staff
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adicionar um novo produto')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nome do produto')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Descrição do produto')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Preço do produto')
                        .setRequired(true)
                        .setMinValue(0))
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Categoria do produto')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remover um produto')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nome do produto')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Editar um produto')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nome do produto')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Nova descrição'))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Novo preço')
                        .setMinValue(0))
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Nova categoria'))
                .addBooleanOption(option =>
                    option.setName('instock')
                        .setDescription('Disponível em estoque')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Listar todos os produtos')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Filtrar por categoria'))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                return await handleAddProduct(interaction);
            case 'remove':
                return await handleRemoveProduct(interaction);
            case 'edit':
                return await handleEditProduct(interaction);
            case 'list':
                return await handleListProducts(interaction);
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const products = await Product.find({
            name: { $regex: focusedValue, $options: 'i' }
        }).limit(25);

        await interaction.respond(
            products.map(product => ({
                name: product.name,
                value: product.name
            }))
        );
    }
};

async function handleAddProduct(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const price = interaction.options.getNumber('price');
    const category = interaction.options.getString('category');

    try {
        const product = new Product({
            name,
            description,
            price,
            category
        });

        await product.save();

        const embed = new EmbedBuilder()
            .setTitle('✅ Produto Adicionado')
            .setDescription(`Produto ${name} adicionado com sucesso!`)
            .addFields(
                { name: 'Preço', value: `R$ ${price.toFixed(2)}`, inline: true },
                { name: 'Categoria', value: category, inline: true },
                { name: 'Descrição', value: description }
            )
            .setColor('Green');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        if (error.code === 11000) {
            return await interaction.reply({
                content: 'Já existe um produto com este nome!',
                ephemeral: true
            });
        }
        throw error;
    }
}

async function handleRemoveProduct(interaction) {
    const name = interaction.options.getString('name');

    const product = await Product.findOneAndDelete({ name });

    if (!product) {
        return await interaction.reply({
            content: 'Produto não encontrado!',
            ephemeral: true
        });
    }

    await interaction.reply({
        content: `Produto ${name} removido com sucesso!`,
        ephemeral: true
    });
}

async function handleEditProduct(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const price = interaction.options.getNumber('price');
    const category = interaction.options.getString('category');
    const inStock = interaction.options.getBoolean('instock');

    const updateData = {};

    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (category) updateData.category = category;
    if (inStock !== null) updateData.inStock = inStock;

    const product = await Product.findOneAndUpdate(
        { name },
        updateData,
        { new: true }
    );

    if (!product) {
        return await interaction.reply({
            content: 'Produto não encontrado!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('✅ Produto Atualizado')
        .setDescription(`Produto ${name} atualizado com sucesso!`)
        .addFields(
            { name: 'Preço', value: `R$ ${product.price.toFixed(2)}`, inline: true },
            { name: 'Categoria', value: product.category, inline: true },
            { name: 'Em Estoque', value: product.inStock ? 'Sim' : 'Não', inline: true },
            { name: 'Descrição', value: product.description }
        )
        .setColor('Blue');

    await interaction.reply({ embeds: [embed] });
}

async function handleListProducts(interaction) {
    const category = interaction.options.getString('category');
    
    const query = category ? { category } : {};
    const products = await Product.find(query).sort({ category: 1, name: 1 });

    if (products.length === 0) {
        return await interaction.reply({
            content: 'Nenhum produto encontrado!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('📦 Lista de Produtos')
        .setColor('Blue');

    products.forEach(product => {
        embed.addFields(
            { name: product.name, value: `Preço: R$ ${product.price.toFixed(2)}\nCategoria: ${product.category}`, inline: true }
        );
    });

    await interaction.reply({ embeds: [embed] });
}
