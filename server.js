import express from "express";
import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";

const app = express();
const PORT = 3000;
const apiKey = process.env.ETHERSCAN_API_KEY;

app.use(express.static("public"));

// Store historical data (for the last 3 hours)
let historicalData = [];

app.get("/get-gas-fees", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`
        );
        const data = await response.json();

        console.log({
            low: data.result.SafeGasPrice,
            average: data.result.ProposeGasPrice,
            high: data.result.FastGasPrice,
        });

        // Push current gas fees to the historical data array
        const timestamp = new Date().toISOString();
        historicalData.push({
            timestamp,
            low: data.result.SafeGasPrice,
            average: data.result.ProposeGasPrice,
            high: data.result.FastGasPrice
        });

        // Limit the historical data to 3 hours (180 minutes)
        const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
        historicalData = historicalData.filter(entry => new Date(entry.timestamp) > threeHoursAgo);

        res.json({
            low: data.result.SafeGasPrice,
            average: data.result.ProposeGasPrice,
            high: data.result.FastGasPrice,
            historicalData
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching gas fees");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
