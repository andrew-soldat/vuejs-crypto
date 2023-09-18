const API_KEY =
  "6d22c77eeb77aa8094333ff4f97d5a2a3edd8026068adc6a9d915761a7f8f498";

const tickersHandlers = new Map();

export const loadTickers = () => {
  if (tickersHandlers.size === 0) {
    return;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?&fsyms=${[
      ...tickersHandlers.keys(),
    ].join(",")}&tsyms=USD&key=${API_KEY}`
  )
    .then((r) => r.json())
    .then((rawData) => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );
      Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const handlers = tickersHandlers.get(currency) ?? [];
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
};

setInterval(loadTickers, 3000);

window.tickers = tickersHandlers;

// получить стоимость криптовалютных пар с АПИшки?
// получать ОБНОВЛЕНИЯ стоимости криптовалютных пар с АПИШки
