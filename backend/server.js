const app = require("./app");
const tradeProcessor = require("./app/services/tradeProcessor");

const PORT = process.env.PORT || 8080;

// Start the trade processor
tradeProcessor.start();

console.log(`Attempting to start server on port ${PORT}...`);
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log('Trade processor is running in the background');
});

server.on('error', (e) => {
  console.error("❌ Server failed to start:", e);
});