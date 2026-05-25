const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    Events
} = require('discord.js');

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

client.once(Events.ClientReady, () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== 'start') return;

    await interaction.reply('⏳ Connexion à Aternos...');

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Aller à la page login
        await page.goto('https://aternos.org/login/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Attendre les champs
        await page.waitForSelector('input[name="user"]', {
            timeout: 15000
        });

        // Login
        await page.type('input[name="user"]', ATERNOS_USER);
        await page.type('input[name="password"]', ATERNOS_PASSWORD);

        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({
                waitUntil: 'networkidle2',
                timeout: 60000
            })
        ]);

        // Aller au serveur
        await page.goto(
            `https://aternos.org/server/${ATERNOS_SERVER}`,
            {
                waitUntil: 'networkidle2',
                timeout: 60000
            }
        );

        // Attendre le bouton start
        await page.waitForSelector('.server-start', {
            timeout: 20000
        });

        await page.click('.server-start');

        await browser.close();

        await interaction.editReply(
            '✅ Serveur Aternos démarré !'
        );

    } catch (err) {
        console.error(err);

        await interaction.editReply(
            `❌ Erreur : ${err.message}`
        );
    }
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('start')
            .setDescription('Démarre le serveur Minecraft')
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(
            CLIENT_ID,
            GUILD_ID
        ),
        { body: commands }
    );

    console.log('✅ Slash command créée');
}

registerCommands();
client.login(TOKEN);
