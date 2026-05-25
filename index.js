const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const puppeteer = require('puppeteer');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const ATERNOS_USER = process.env.ATERNOS_USER;
const ATERNOS_PASSWORD = process.env.ATERNOS_PASSWORD;
const ATERNOS_SERVER = process.env.ATERNOS_SERVER;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'start') {
        await interaction.reply('⏳ Démarrage du serveur Aternos...');

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            await page.goto('https://aternos.org/go/', {
                waitUntil: 'networkidle2'
            });

            // Login
            await page.type('input[name="user"]', ATERNOS_USER);
            await page.type('input[name="password"]', ATERNOS_PASSWORD);

            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation()
            ]);

            // Ouvrir le serveur
            await page.goto(
                `https://aternos.org/server/${ATERNOS_SERVER}`,
                { waitUntil: 'networkidle2' }
            );

            // Cliquer Start
            await page.waitForSelector('.server-start');
            await page.click('.server-start');

            await browser.close();

            await interaction.editReply('✅ Serveur Aternos démarré !');
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erreur lors du démarrage.');
        }
    }
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('start')
            .setDescription('Démarrer le serveur Minecraft')
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
}

registerCommands();
client.login(TOKEN);
