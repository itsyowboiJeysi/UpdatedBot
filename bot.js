require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Dummy web server to keep the bot alive on Replit/Render
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Web server listening on port ${PORT}`));

// Initialize Discord Client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required to read the !watch command
    ],
});

const PREFIX = '!watch';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

client.once('ready', () => {
    console.log(`✅ Bot is online as ${client.user.tag}!`);
    console.log(`Type !watch <movie> in your Discord server.`);
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages and messages that don't start with prefix
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    // Extract the movie query
    const query = message.content.slice(PREFIX.length).trim();

    if (!query) {
        return message.reply('Please provide a movie name! Example: `!watch The Matrix`');
    }

    try {
        // Send a temporary typing indicator or thinking message
        const thinkingMsg = await message.reply(`🔍 Searching TMDB for **${query}**...`);

        // Fetch movie from TMDB
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: query
            }
        });

        const results = response.data.results;

        if (results.length === 0) {
            return thinkingMsg.edit(`❌ Sorry, I couldn't find any movie matching "${query}".`);
        }

        // Get the top result
        const movie = results[0];
        
        // Prepare embed data
        const embedUrl = `https://vidsrc.me/embed/movie?tmdb=${movie.id}`;
        const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';

        // Build the rich embed
        const movieEmbed = new EmbedBuilder()
            .setColor('#e50914') // GENMOV Red
            .setTitle(`${movie.title} (${releaseYear})`)
            .setURL(embedUrl)
            .setDescription(movie.overview || 'No description available.')
            .addFields(
                { name: 'Rating', value: `⭐ ${rating}/10`, inline: true },
                { name: 'TMDB ID', value: `${movie.id}`, inline: true }
            )
            .setFooter({ text: 'Powered by GENMOV & TMDB' });

        if (posterUrl) {
            movieEmbed.setThumbnail(posterUrl);
        }

        // Send the response
        await thinkingMsg.edit({
            content: `🎬 Found it! Open a Brave browser to open the link below:\n${embedUrl}`,
            embeds: [movieEmbed]
        });

    } catch (error) {
        console.error('Error fetching from TMDB:', error);
        message.reply('❌ An error occurred while searching for the movie. Please try again later.');
    }
});

// Login to Discord
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: Missing DISCORD_TOKEN in .env file!');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
