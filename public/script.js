


let gasPriceChart; // Global reference to the chart
let gasData = []; // Array to store gas prices with time
const dataTimeFrame = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const storageKey = "gasData";

// Load previously saved data from localStorage if available
const savedData = JSON.parse(localStorage.getItem(storageKey));

function getCurrentTime() {
    return new Date().getTime(); // Get current timestamp
}

// Only load data if it's within the 3-hour window
initializeChart();
if (savedData && savedData.timestamp && (getCurrentTime() - savedData.timestamp) < dataTimeFrame) {
    gasData = savedData.data;
    updateChart(); // Update chart with saved data
}

// Save gas data and timestamp to localStorage
function saveToLocalStorage() {
    const dataToSave = {
        timestamp: getCurrentTime(), // Save the current timestamp
        data: gasData, // Save the gas data array
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}

// Check if the data is older than 3 hours and clear it
function checkDataExpiry() {
    const currentTime = getCurrentTime(); // Update current time dynamically
    const savedData = JSON.parse(localStorage.getItem(storageKey));
    if (savedData && savedData.timestamp && (currentTime - savedData.timestamp) >= dataTimeFrame) {
        // If data is older than 3 hours, clear it
        localStorage.removeItem(storageKey);
        gasData = []; // Reset the gas data array
        saveToLocalStorage(); // Save the cleared data
    }
}

// Fetch the gas fees
async function fetchGasFees() {
    try {
        const response = await fetch("/get-gas-fees");
        const data = await response.json();

        // Display gas fees in the DOM
        const gasFeesDiv = document.getElementById("gas-fees");
        gasFeesDiv.innerHTML = `
            <p class="gas-fee">Low: ${data.low} GWEI</p>
            <p class="gas-fee">Average: ${data.average} GWEI</p>
            <p class="gas-fee">High: ${data.high} GWEI</p>
        `;

        // Only add new data if the change in gas fees is >= 1 GWEI
        const lastData = gasData[gasData.length - 1]; // Get the most recent data

        if (
            !lastData || 
            Math.abs(data.low - lastData.low) >= 1 || 
            Math.abs(data.average - lastData.average) >= 1 || 
            Math.abs(data.high - lastData.high) >= 1
        ) {
            // Store the gas fee data along with the current timestamp
            const timestamp = new Date(); // Current timestamp
            gasData.push({ timestamp: new Date(), low: data.low, average: data.average, high: data.high });

            // Check if the data has exceeded the 3-hour period and clear if necessary
            checkDataExpiry();

            // Save the updated gas data to localStorage
            saveToLocalStorage();

            // Update the chart with the latest data
            updateChart();
        }

    } catch (error) {
        console.error("Error fetching gas fees:", error);
    }
}

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById("gas-fee-chart").getContext("2d");
    // Destroy the old chart instance if it exists
    if (gasPriceChart) {
        gasPriceChart.destroy();
    }
    gasPriceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [], // Time labels (x-axis)
            datasets: [
                {
                    label: "Low",
                    data: [],
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: "Average",
                    data: [],
                    borderColor: "orange",
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: "High",
                    data: [],
                    borderColor: "red",
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time",
                    },
                    type: "time",
                    time: {
                        unit: "minute",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Gas Price (GWEI)",
                    },
                    beginAtZero: true,
                },
            },
        },
    });
}

// Update the chart with new data
function updateChart() {
    // Clear previous chart data
    gasPriceChart.data.labels = [];
    gasPriceChart.data.datasets[0].data = [];
    gasPriceChart.data.datasets[1].data = [];
    gasPriceChart.data.datasets[2].data = [];

    // Add new data to the chart
    gasData.forEach((entry) => {
        gasPriceChart.data.labels.push(entry.timestamp); // Time is on the x-axis
        gasPriceChart.data.datasets[0].data.push(entry.low); // Low gas price (y-axis)
        gasPriceChart.data.datasets[1].data.push(entry.average); // Average gas price (y-axis)
        gasPriceChart.data.datasets[2].data.push(entry.high); // High gas price (y-axis)
    });

    // Refresh the chart
    gasPriceChart.update();
}

// Initialize the chart when the page loads
initializeChart();

// Attach the fetchGasFees function to the refresh button
document.getElementById("refresh-button").addEventListener("click", fetchGasFees);

// Automatically check data expiry every 3 hours
setInterval(checkDataExpiry, dataTimeFrame);
