import express from 'express';
import { updateAllPrices } from './index';

const app = express();

app.get('/health', async (req, res) => {
    res.json({ status: 'ok' });
})

app.post('/trigger-scrape', async (req, res) => {
    try {
        await updateAllPrices();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});


app.listen(3001);