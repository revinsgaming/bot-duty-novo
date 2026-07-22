const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // Dibutuhkan untuk membaca Display Name
    ]
});

// Ambil data dari Variables Railway
const URL_SCRIPT = process.env.URL_SCRIPT;
const ID_CHANNEL_KHUSUS = process.env.ID_CHANNEL_KHUSUS;
const LINK_SPREADSHEET = process.env.LINK_SPREADSHEET;
const TOKEN_BOT = process.env.TOKEN_BOT;

client.once('ready', () => {
    console.log(`✅ Bot Berhasil Online sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // 1. Validasi: Abaikan jika pesan dari bot lain
    if (message.author.bot) return;

    // 2. Validasi: Hanya respon di Channel Khusus
    if (message.channel.id !== ID_CHANNEL_KHUSUS) return;

    const cmd = message.content.toLowerCase();
    
    // Mengambil Nickname (Display Name), jika tidak ada pakai Username asli
    const displayName = message.member ? message.member.displayName : message.author.username;

    try {
        // --- COMMAND !ON ---
        if (cmd === '!on') {
            await axios.post(URL_SCRIPT, { 
                action: 'on', 
                userId: message.author.id, 
                username: displayName 
            });
            message.reply(`🔧 **${displayName}** mulai duty! Semangat kerjanya.`);
        } 

        // --- COMMAND !OFF ---
        else if (cmd === '!off') {
            const res = await axios.post(URL_SCRIPT, { action: 'off', userId: message.author.id });
            if (res.data === "BelumOn") {
                return message.reply("❌ Kamu belum mengetik `!on` sebelumnya!");
            }
            message.reply(`✅ **${displayName}** selesai duty. Durasi sesi ini: **${res.data} menit**.`);
        } 

        // --- COMMAND !LIST ---
        else if (cmd === '!list') {
            const res = await axios.post(URL_SCRIPT, { action: 'list' });
            message.reply(`📋 **Daftar Durasi Mekanik:**\n${res.data}`);
        } 

        // --- COMMAND !LINK (KHUSUS ADMIN) ---
        else if (cmd === '!link') {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply("🚫 Maaf, hanya Admin yang bisa melihat link spreadsheet.");
            }
            message.reply(`🔗 **Link Spreadsheet Mekanik:**\n${LINK_SPREADSHEET}`);
        } 

        // --- COMMAND !RESET (KHUSUS ADMIN) ---
        else if (cmd === '!reset') {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply("🚫 Maaf, hanya Admin yang bisa mereset data.");
            }
            await axios.post(URL_SCRIPT, { action: 'reset' });
            message.reply("🧹 Semua data waktu telah berhasil direset!");
        }
        
    } catch (error) {
        console.error("Error Koneksi Google Sheets:", error.message);
        message.reply("⚠️ Gagal terhubung ke database (Google Sheets). Pastikan URL Script benar.");
    }
});

client.login(TOKEN_BOT);
