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

// Bot prêt
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
});

// Slash Command
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'start') return;

    await interaction.reply('⏳ Démarrage du serveur Aternos...');

    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // User agent pour éviter certains blocages
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
        );

        // Aller sur Aternos
        await page.goto('https://aternos.org/go/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Attendre chargement
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        console.log('🌍 URL actuelle:', page.url());

        // Accepter cookies si popup
        try {
            await page.click('.fc-button.fc-cta-consent');
            console.log('✅ Cookies acceptés');
        } catch {
            console.log('ℹ️ Pas de popup cookie');
        }

        // Attendre champs login
        await page.waitForSelector('input', {
            timeout: 30000
        });

        const inputs = await page.$$('input');

        if (inputs.length < 2) {
            throw new Error(
                'Impossible de trouver les champs login'
            );
        }

        // Login
        await inputs[0].type(ATERNOS_USER);
        await inputs[1].type(ATERNOS_PASSWORD);

        console.log('✅ Login rempli');

        // Connexion
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({
                waitUntil: 'networkidle2',
                timeout: 60000
            })
        ]);

        console.log('✅ Connecté à Aternos');

        // Ouvrir serveur
        await page.goto(
            `https://aternos.org/server/${ATERNOS_SERVER}`,
            {
                waitUntil: 'networkidle2',
                timeout: 60000
            }
        );

        console.log('✅ Page serveur ouverte');

        // Attendre bouton start
        await page.waitForSelector('.server-start', {
            timeout: 30000
        });

        // Cliquer start
        await page.click('.server-start');

        console.log('🚀 Serveur démarré');

        await interaction.editReply(
            '✅ Serveur Minecraft démarré !'
        );

    } catch (err) {
        console.error('❌ Erreur complète:', err);

        await interaction.editReply(
            `❌ Erreur : ${err.message}`
        );
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Enregistrer slash command
async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('start')
            .setDescription(
                'Démarre le serveur Minecraft Aternos'
            )
            .toJSON()
    ];

    const rest = new REST({
        version: '10'
    }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            '✅ Commande /start enregistrée'
        );
    } catch (err) {
        console.error(
            '❌ Erreur commande slash:',
            err
        );
    }
}

registerCommands();

client.login(TOKEN);
