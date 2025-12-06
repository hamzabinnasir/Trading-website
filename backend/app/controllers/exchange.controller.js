const axios = require('axios');

// Coin mapping for CoinLore API
const COIN_MAP = {
  bitcoin: '90',
  ethereum: '80',
  xrp: '58',
  tether: '518',
  bitcoinCash: '2321',
  bitcoinSV: '33234',
  litecoin: '1',
  binancecoin: '2710',
  eos: '2679',
  tezos: '3682',
  ethereumClassic: '118',
  bitshares: '54',
};

exports.getCurrentPrice = async (req, res) => {
  try {
    const { coin } = req.params;

    if (!COIN_MAP[coin]) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const response = await axios.get(`https://api.coinlore.net/api/ticker/?id=${COIN_MAP[coin]}`);

    if (response.data && response.data[0]) {
      // Return just the price number as frontend expects
      res.json(parseFloat(response.data[0].price_usd));
    } else {
      res.status(404).json({ message: "Price data not available" });
    }
  } catch (error) {
    console.error("Price fetch error:", error);
    res.status(500).json({ message: "Price fetch failed" });
  }
};

exports.getCoinInformation = async (req, res) => {
  try {
    const { coin } = req.params;

    if (!COIN_MAP[coin]) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const response = await axios.get(`https://api.coinlore.net/api/ticker/?id=${COIN_MAP[coin]}`);

    if (response.data && response.data[0]) {
      const data = response.data[0];
      res.json({
        percent_change_1h: parseFloat(data.percent_change_1h) || 0,
        percent_change_24h: parseFloat(data.percent_change_24h) || 0,
        percent_change_7d: parseFloat(data.percent_change_7d) || 0
      });
    } else {
      res.status(404).json({ message: "Coin information not available" });
    }
  } catch (error) {
    console.error("Information fetch error:", error);
    res.status(500).json({ message: "Information fetch failed" });
  }
};