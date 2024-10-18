const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { connect } = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const handlersPath = path.join(__dirname, 'handlers');
const modalsPath = path.join(handlersPath, 'modals');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.config = config;

function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            
            if (!command.data || !command.data.name) {
                console.error(`❌ Erro: Comando no arquivo ${file} está faltando 'data' ou 'name'`);
                continue;
            }

            client.commands.set(command.data.name, command);
            console.log(`✅ Comando carregado: ${command.data.name}`);
        }
    }
}

function loadHandlers() {
    const handlersPath = path.join(__dirname, 'handlers');
    
    const buttonsPath = path.join(handlersPath, 'buttons');
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
    
    for (const file of buttonFiles) {
        const button = require(path.join(buttonsPath, file));
        client.buttons.set(button.id, button);
        console.log(`✅ Button handler carregado: ${button.id}`);
    }

    const menusPath = path.join(handlersPath, 'menus');
    const menuFiles = fs.readdirSync(menusPath).filter(file => file.endsWith('.js'));

    for (const file of menuFiles) {
        const menu = require(path.join(menusPath, file));
        client.selectMenus.set(menu.id, menu);
        console.log(`✅ Menu handler carregado: ${menu.id}`);
    }

    const channelMoverHandlers = require('./handlers/menus/select_menus');
    client.selectMenus.set('select-channel', channelMoverHandlers['select-channel']);
    client.selectMenus.set('select-category', channelMoverHandlers['select-category']);
    console.log(`✅ Channel mover handlers carregados`);

    const channelRenameHandlers = require('./handlers/menus/select_name');
    client.selectMenus.set('select-channel-rename', channelRenameHandlers['select-channel-rename']);
    console.log(`✅ Channel rename handlers carregados`);
}


client.once('ready', () => {
    console.log(`🤖 Bot online como ${client.user.tag}`);
    
    connect(config.mongodb_uri)
        .then(() => console.log('📦 Conectado ao MongoDB'))
        .catch(error => console.error('❌ Erro ao conectar ao MongoDB:', error));

    loadCommands();
    loadHandlers();
});

if (fs.existsSync(modalsPath)) {
    const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

    if (modalFiles.length > 0) {
        for (const file of modalFiles) {
            const modal = require(path.join(modalsPath, file));
            console.log(`Carregando modal: ${file}`);
        }
    } else {
        console.log('Nenhum arquivo .js encontrado na pasta modals.');
    }
} else {
    console.error(`A pasta ${modalsPath} não existe.`);
}

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction, client);
        } else if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (!button) return;

            await button.execute(interaction, client);
        } else if (interaction.isStringSelectMenu()) {
            const menu = client.selectMenus.get(interaction.customId);
            if (!menu) return;

            await menu.execute(interaction, client);
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('rename-channel-')) {
                const channelRenameHandlers = require('./handlers/menus/select_name');
                await channelRenameHandlers.handleRenameModal(interaction);
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Ocorreu um erro ao processar sua interação. Por favor, tente novamente mais tarde.',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: 'Ocorreu um erro ao processar sua interação. Por favor, tente novamente mais tarde.',
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('Error sending error message to user:', followUpError);
        }
    }
});



client.login(config.token);