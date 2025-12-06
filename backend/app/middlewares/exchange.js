const axios = require("axios").default;

// This file is deprecated - use exchange.controller.js instead
// Keeping for backward compatibility with existing code

notDefined = (req, res, next) => {
    res.json({ "error": "endpoint not defined" });
};

getCurrentPrice = (coin) => {
    const coinMap = {
        "bitcoin": "90",
        "dash": "8", 
        "monero": "28",
        "ethereum": "80",
        "xrp": "58",
        "tether": "518",
        "bitcoinCash": "2321",
        "bitcoinSV": "33234", 
        "litecoin": "1",
        "eos": "2679",
        "binancecoin": "2710",
        "tezos": "3682"
    };

    const coinId = coinMap[coin];
    if (!coinId) {
        return Promise.reject(new Error("Invalid coin"));
    }

    const api_link = `https://api.coinlore.net/api/ticker/?id=${coinId}`;
    return axios.get(api_link);
};

const exchange = {
    notDefined,
    getCurrentPrice
};

module.exports = exchange;