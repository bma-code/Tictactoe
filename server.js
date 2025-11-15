const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize leaderboard file if it doesn't exist
async function initializeLeaderboard() {
    try {
        await fs.access(LEADERBOARD_FILE);
    } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]));
    }
}

// Read leaderboard from file
async function readLeaderboard() {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

// Write leaderboard to file
async function writeLeaderboard(leaderboard) {
    try {
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    } catch (error) {
        console.error('Error writing leaderboard:', error);
        throw error;
    }
}

// GET /api/leaderboard - Get top 10 players
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await readLeaderboard();
        // Sort by wins descending, then by total games ascending (fewer games = better win rate)
        const sortedLeaderboard = leaderboard
            .sort((a, b) => {
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                return a.totalGames - b.totalGames;
            })
            .slice(0, 10);
        
        res.json(sortedLeaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// POST /api/leaderboard - Submit a game result
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { playerName, result } = req.body;
        
        if (!playerName || !result) {
            return res.status(400).json({ error: 'Player name and result are required' });
        }

        if (!['win', 'loss', 'draw'].includes(result)) {
            return res.status(400).json({ error: 'Result must be win, loss, or draw' });
        }

        const leaderboard = await readLeaderboard();
        
        // Find existing player or create new one
        let player = leaderboard.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (!player) {
            player = {
                name: playerName,
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                winRate: 0
            };
            leaderboard.push(player);
        }

        // Update player stats
        player.totalGames++;
        if (result === 'win') {
            player.wins++;
        } else if (result === 'loss') {
            player.losses++;
        } else {
            player.draws++;
        }
        
        // Calculate win rate
        player.winRate = player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0;

        await writeLeaderboard(leaderboard);
        res.json({ message: 'Score submitted successfully', player });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

// Start server
async function startServer() {
    await initializeLeaderboard();
    app.listen(PORT, () => {
        console.log(`Leaderboard server running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);