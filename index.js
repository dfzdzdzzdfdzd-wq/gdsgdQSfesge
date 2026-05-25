const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { Aternos } = require('aternos-api');

// Railway Variables
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const ATERNOS_USER = process.env.ATERNOS_USER;
const ATERNOS_PASSWORD = process.env.ATERNOS_PASSWORD;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'start') {
        await interaction.reply('⏳ Démarrage du serveur Aternos...');

        try {
            const aternos = new Aternos();
            await aternos.login(ATERNOS_USER, ATERNOS_PASSWORD);

            const servers = await aternos.getServers();
            const server = servers[0];

            await server.start();

            await interaction.editReply('✅ Serveur Minecraft démarré !');
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erreur au démarrage du serveur.');
        }
    }
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('start')
            .setDescription('Démarre le serveur Minecraft Aternos')
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log('✅ Slash command enregistrée');
    } catch (error) {
        console.error(error);
    }
}

registerCommands();
client.login(TOKEN);
