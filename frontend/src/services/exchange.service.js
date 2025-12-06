import Axios from "axios";

const API_URL = "http://localhost:8080/api/exchange";

class ExchangeService {
  getCurrentPrice(coin) {
    return Axios.get(API_URL + "/price/" + coin)
      .then((response) => {
        return response.data; // Directly return the price number
      })
      .catch(error => {
        console.error("Price fetch error:", error);
        throw error;
      });
  }

  getPercentChange(coin) {
    return Axios.get(API_URL + "/information/" + coin)
      .then((response) => {
        return {
          hour: response.data.percent_change_1h || 0,
          day: response.data.percent_change_24h || 0,
          week: response.data.percent_change_7d || 0
        };
      })
      .catch(error => {
        console.error("Percent change fetch error:", error);
        return { hour: 0, day: 0, week: 0 };
      });
  }
}

export default new ExchangeService();