class Currency {
  constructor(code, name) {
    this.code = code;
    this.name = name;
  }
}

class CurrencyConverter {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.currencies = [];
  }

  async getCurrencies() {
    try {
      const response = await fetch(`${this.apiUrl}/currencies`);
      const data = await response.json();
      this.currencies = Object.keys(data).map(
        (code) => new Currency(code, data[code])
      );
    } catch (error) {
      console.error("Error al obtener las monedas:", error);
    }
  }
  async getConversionRate(fromCurrency, toCurrency) {
    try {
      const response = await fetch(
        `${this.apiUrl}/latest?from=${fromCurrency.code}&to=${toCurrency.code}`
      );
      const data = await response.json();
      const rate = data.rates[toCurrency.code];
      return rate;
    } catch (error) {
      console.error("Error al obtener la tasa de conversión:", error);
      return null;
    }
  }

  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency.code === toCurrency.code) {
      return amount;
    }
    const rate = await this.getConversionRate(fromCurrency, toCurrency);
    if (rate !== null) {
      return amount * rate;
    } else {
      return null;
    }
  }
  async getRateDifference(fromCurrency, toCurrency) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const rateToday = await this.getConversionRate(fromCurrency, toCurrency, today);
    const rateYesterday = await this.getConversionRate(fromCurrency, toCurrency, yesterday);

    if (rateToday !== null && rateYesterday !== null) {
        return rateToday - rateYesterday;
    } else {
        return null;
    }
}
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("conversion-form");
  const resultDiv = document.getElementById("result");
  const fromCurrencySelect = document.getElementById("from-currency");
  const toCurrencySelect = document.getElementById("to-currency");
  const rateDiffDiv = document.getElementById("rate-diff");

  const converter = new CurrencyConverter("https://api.frankfurter.app");

  await converter.getCurrencies();
  populateCurrencies(fromCurrencySelect, converter.currencies);
  populateCurrencies(toCurrencySelect, converter.currencies);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const amount = document.getElementById("amount").value;
    const fromCurrency = converter.currencies.find(
      (currency) => currency.code === fromCurrencySelect.value
    );
    const toCurrency = converter.currencies.find(
      (currency) => currency.code === toCurrencySelect.value
    );

    const convertedAmount = await converter.convertCurrency(
      amount,
      fromCurrency,
      toCurrency
    );

    if (convertedAmount !== null && !isNaN(convertedAmount)) {
      resultDiv.textContent = `${amount} ${
        fromCurrency.code
      } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
    } else {
      resultDiv.textContent = "Error al realizar la conversión.";
    }
    const rateDifference = await converter.getRateDifference(fromCurrency, toCurrency);
    if (rateDifference !== null) {
        rateDiffDiv.textContent = `Diferencia de tasa de cambio entre hoy y ayer: ${rateDifference.toFixed(6)}`;
    } else {
        rateDiffDiv.textContent = "Error al obtener la diferencia de tasa de cambio.";
    }
  });

  function populateCurrencies(selectElement, currencies) {
    if (currencies) {
      currencies.forEach((currency) => {
        const option = document.createElement("option");
        option.value = currency.code;
        option.textContent = `${currency.code} - ${currency.name}`;
        selectElement.appendChild(option);
      });
    }
  }
});
