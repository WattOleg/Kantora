var SHEET_TRANSACTIONS = typeof SHEET_TRANSACTIONS !== 'undefined' ? SHEET_TRANSACTIONS : 'Transactions';
var SHEET_PORTFOLIO = typeof SHEET_PORTFOLIO !== 'undefined' ? SHEET_PORTFOLIO : 'Portfolio';
var SHEET_DIVIDENDS = typeof SHEET_DIVIDENDS !== 'undefined' ? SHEET_DIVIDENDS : 'Dividends';
var SHEET_SUMMARY = typeof SHEET_SUMMARY !== 'undefined' ? SHEET_SUMMARY : 'Summary';

// ---- Web App Entrypoints ----

function doGet(e) {
  var action = '';
  if (e && e.parameter && typeof e.parameter.action !== 'undefined') {
    action = String(e.parameter.action || '').trim();
  } else if (e && e.parameters && e.parameters.action && e.parameters.action.length) {
    action = String(e.parameters.action[0] || '').trim();
  }

  // Backward-compatible default: direct /exec call returns full dataset.
  if (!action) action = 'getData';
  switch (action) {
    case 'getData':
      return jsonResponse(getData_());
    case 'getTransactions':
      return jsonResponse(getTransactions_());
    case 'getPortfolio':
      return jsonResponse(getPortfolio_());
    case 'getSummary':
      return jsonResponse(getSummary_());
    case 'getDividends':
      return jsonResponse(getDividends_());
    case 'syncPortfolioPrices':
      var syncResultGet = syncPortfolioPrices_();
      recalculateSummary_();
      return jsonResponse(Object.assign({ status: 'ok' }, syncResultGet));
    default:
      return jsonError('Unknown action: ' + action, 400);
  }
}

function getData_() {
  return {
    portfolio: getPortfolio_(),
    summary: getSummary_(),
    transactions: getTransactions_(),
    dividends: getDividends_()
  };
}

function doPost(e) {
  const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  const action = (body.action || '').trim();
  try {
    switch (action) {
      case 'addTransaction':
        addTransaction_(body);
        recalculatePortfolio_();
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'addDividend':
        addDividend_(body);
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'updateDividend':
        updateDividend_(body);
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'deleteDividend':
        deleteDividend_(body.id);
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'deleteTransaction':
        deleteTransaction_(body.id);
        recalculatePortfolio_();
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'updatePortfolioPrice':
        updatePortfolioPrice_(body.ticker, body.current_price);
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'updateTransaction':
        updateTransaction_(body);
        recalculatePortfolio_();
        recalculateSummary_();
        return jsonResponse({ status: 'ok' });
      case 'syncPortfolioPrices':
        var syncResultPost = syncPortfolioPrices_();
        recalculateSummary_();
        return jsonResponse(Object.assign({ status: 'ok' }, syncResultPost));
      default:
        return jsonError('Unknown action: ' + action, 400);
    }
  } catch (err) {
    return jsonError(err.message || String(err), 500);
  }
}

// ---- Helpers ----

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message, statusCode) {
  const response = ContentService.createTextOutput(
    JSON.stringify({ error: message, status: 'error', code: statusCode })
  ).setMimeType(ContentService.MimeType.JSON);
  return response;
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function getDataWithHeader_(sheetName) {
  const sheet = getSheet_(sheetName);
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (!values.length) return [];
  const headers = values[0];
  const rows = values.slice(1);
  return rows
    .filter(function (row) {
      return row.join('').trim() !== '';
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        obj[h] = row[i];
      });
      return normalizeRow_(obj);
    });
}

function roundToScale_(value, scale) {
  var num = Number(value);
  if (!isFiniteNumber_(num)) return 0;
  var factor = Math.pow(10, scale || 0);
  return Math.round(num * factor) / factor;
}

function parsePrice_(value) {
  return roundToScale_(value, 10);
}

function isFiniteNumber_(value) {
  return typeof value === 'number' && isFinite(value);
}

function normalizeRow_(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (v instanceof Date) {
      out[k] = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      out[k] = v;
    }
  });
  return out;
}

// ---- GET Handlers ----

function getTransactions_() {
  return getDataWithHeader_(SHEET_TRANSACTIONS);
}

function getPortfolio_() {
  return getDataWithHeader_(SHEET_PORTFOLIO);
}

function getDividends_() {
  return getDataWithHeader_(SHEET_DIVIDENDS);
}

function getSummary_() {
  var sheet = getSheet_(SHEET_SUMMARY);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (!values.length) return null;
  var headers = values[0];
  var row = values[1] || [];
  var obj = {};
  headers.forEach(function (h, i) {
    obj[h] = row[i] || 0;
  });
  return obj;
}

// ---- POST Handlers ----

function addTransaction_(payload) {
  var sheet = getSheet_(SHEET_TRANSACTIONS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Columns: id, date, type, asset_name, ticker, quantity, price, commission, currency, total, notes
  var id = new Date().getTime().toString();
  var date =
    payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var type = (payload.type || '').toUpperCase();
  var asset_name = payload.asset_name || '';
  var ticker = (payload.ticker || '').toUpperCase();
  var quantity = Number(payload.quantity || 0);
  var price = parsePrice_(payload.price || 0);
  var commission = Number(payload.commission || 0);
  var currency = payload.currency || 'USD';
  var total = roundToScale_(quantity * price, 10);
  var notes = payload.notes || '';

  var rowObj = {
    id: id,
    date: date,
    type: type,
    asset_name: asset_name,
    ticker: ticker,
    quantity: quantity,
    price: price,
    commission: commission,
    currency: currency,
    total: total,
    notes: notes
  };

  var row = headers.map(function (h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  sheet.appendRow(row);
}

function addDividend_(payload) {
  var sheet = getSheet_(SHEET_DIVIDENDS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Columns: id, date, ticker, asset_name, amount, tax, net_amount, currency
  var id = new Date().getTime().toString();
  var date =
    payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var ticker = (payload.ticker || '').toUpperCase();
  var asset_name = payload.asset_name || '';
  var amount = Number(payload.amount || payload.quantity || 0);
  var tax = Number(payload.tax || 0);
  var net_amount = amount - tax;
  var currency = payload.currency || 'USD';

  var rowObj = {
    id: id,
    date: date,
    ticker: ticker,
    asset_name: asset_name,
    amount: amount,
    tax: tax,
    net_amount: net_amount,
    currency: currency
  };

  var row = headers.map(function (h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  sheet.appendRow(row);
}

function updateDividend_(payload) {
  var sheet = getSheet_(SHEET_DIVIDENDS);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idCol = headers.indexOf('id') + 1;
  if (idCol <= 0) throw new Error('No "id" column in Dividends sheet');

  var id = payload.id;
  if (!id) throw new Error('updateDividend requires id');

  var amount = Number(payload.amount || 0);
  var tax = Number(payload.tax || 0);
  var net_amount = amount - tax;

  var rowObj = {
    id: id,
    date: payload.date || '',
    ticker: (payload.ticker || '').toUpperCase(),
    asset_name: payload.asset_name || '',
    amount: amount,
    tax: tax,
    net_amount: net_amount,
    currency: payload.currency || 'USD'
  };

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var cellId = sheet.getRange(row, idCol).getValue();
    if (String(cellId) !== String(id)) continue;

    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      var val = rowObj[h];
      if (val !== undefined) {
        sheet.getRange(row, c + 1).setValue(val);
      }
    }
    return;
  }
}

function deleteDividend_(id) {
  var sheet = getSheet_(SHEET_DIVIDENDS);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idCol = headers.indexOf('id') + 1;
  if (idCol <= 0) throw new Error('No "id" column in Dividends sheet');

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var cellId = sheet.getRange(row, idCol).getValue();
    if (String(cellId) === String(id)) {
      sheet.deleteRow(row);
      return;
    }
  }
}

function deleteTransaction_(id) {
  var sheet = getSheet_(SHEET_TRANSACTIONS);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idCol = headers.indexOf('id') + 1;
  if (idCol <= 0) throw new Error('No "id" column in Transactions sheet');

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var cellId = sheet.getRange(row, idCol).getValue();
    if (String(cellId) === String(id)) {
      sheet.deleteRow(row);
      return;
    }
  }
}

function updatePortfolioPrice_(ticker, currentPrice) {
  var sheet = getSheet_(SHEET_PORTFOLIO);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idx = {};
  headers.forEach(function (h, i) {
    idx[h] = i;
  });

  var tickerCol = (idx.ticker || 0) + 1;
  var currentPriceCol = (idx.current_price || 0) + 1;
  var marketValueCol = (idx.market_value || 0) + 1;
  var unrealizedPnlCol = (idx.unrealized_pnl || 0) + 1;
  var pnlPercentCol = (idx.pnl_percent || 0) + 1;

  if (!tickerCol || !currentPriceCol) throw new Error('Portfolio sheet missing ticker or current_price column');

  var tickerStr = String(ticker || '').toUpperCase();
  var price = parsePrice_(currentPrice);
  if (!isFiniteNumber_(price)) return;

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var rowTicker = String(sheet.getRange(row, tickerCol).getValue() || '').toUpperCase();
    if (rowTicker !== tickerStr) continue;

    var quantity = Number(sheet.getRange(row, (idx.quantity || 0) + 1).getValue() || 0);
    var totalInvested = Number(sheet.getRange(row, (idx.total_invested || 0) + 1).getValue() || 0);

    sheet.getRange(row, currentPriceCol).setValue(price);

    var marketValue = roundToScale_(quantity * price, 10);
    var unrealizedPnl = roundToScale_(marketValue - totalInvested, 10);
    var pnlPercent = totalInvested ? roundToScale_((unrealizedPnl / totalInvested) * 100, 10) : 0;

    if (marketValueCol) sheet.getRange(row, marketValueCol).setValue(marketValue);
    if (unrealizedPnlCol) sheet.getRange(row, unrealizedPnlCol).setValue(unrealizedPnl);
    if (pnlPercentCol) sheet.getRange(row, pnlPercentCol).setValue(pnlPercent);
    return;
  }
}

function fetchYahooQuotes_(tickers) {
  var list = (tickers || [])
    .map(function (t) { return String(t || '').toUpperCase().trim(); })
    .filter(function (t) { return !!t; });
  if (!list.length) return {};

  var endpoint = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(list.join(','));
  var response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
  if (response.getResponseCode() >= 400) {
    throw new Error('Yahoo quote API error: ' + response.getResponseCode());
  }

  var payload = JSON.parse(response.getContentText() || '{}');
  var result = payload && payload.quoteResponse && payload.quoteResponse.result ? payload.quoteResponse.result : [];
  var quotes = {};

  result.forEach(function (item) {
    var symbol = String(item.symbol || '').toUpperCase();
    var marketPrice = parsePrice_(item.regularMarketPrice);
    if (!symbol || !isFiniteNumber_(marketPrice)) return;
    quotes[symbol] = marketPrice;
  });

  return quotes;
}

function fetchStooqQuote_(ticker) {
  var normalized = String(ticker || '').toLowerCase().trim();
  if (!normalized) return null;
  var candidates = normalized.indexOf('.') === -1 ? [normalized + '.us', normalized] : [normalized];

  for (var i = 0; i < candidates.length; i++) {
    var symbol = candidates[i];
    var endpoint = 'https://stooq.com/q/l/?s=' + encodeURIComponent(symbol) + '&i=d';
    var response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
    if (response.getResponseCode() >= 400) continue;

    var body = String(response.getContentText() || '').trim();
    if (!body) continue;
    var row = body.split('\n')[0];
    var cols = row.split(',');
    if (cols.length < 7) continue;

    // Symbol,Date,Time,Open,High,Low,Close,Volume
    var closePrice = parsePrice_(cols[6]);
    if (isFiniteNumber_(closePrice) && closePrice > 0) return closePrice;
  }

  return null;
}

function fetchStooqQuotes_(tickers) {
  var quotes = {};
  (tickers || []).forEach(function (ticker) {
    var key = String(ticker || '').toUpperCase().trim();
    if (!key) return;
    var price = fetchStooqQuote_(key);
    if (isFiniteNumber_(price)) quotes[key] = price;
  });
  return quotes;
}

function syncPortfolioPrices_() {
  var sheet = getSheet_(SHEET_PORTFOLIO);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { updated: 0, yahoo: 0, stooq: 0, missing: 0 };

  var headers = values[0];
  var idx = {};
  headers.forEach(function (h, i) {
    idx[h] = i;
  });

  var tickerIdx = idx.ticker;
  var currentPriceIdx = idx.current_price;
  var quantityIdx = idx.quantity;
  var totalInvestedIdx = idx.total_invested;
  var marketValueIdx = idx.market_value;
  var unrealizedPnlIdx = idx.unrealized_pnl;
  var pnlPercentIdx = idx.pnl_percent;

  if (tickerIdx == null || currentPriceIdx == null) {
    throw new Error('Portfolio sheet missing ticker or current_price column');
  }

  var tickers = values
    .slice(1)
    .map(function (row) { return String(row[tickerIdx] || '').toUpperCase().trim(); })
    .filter(function (ticker) { return !!ticker; });

  if (!tickers.length) return { updated: 0, yahoo: 0, stooq: 0, missing: 0 };

  var quotes = {};
  try {
    quotes = fetchYahooQuotes_(tickers);
  } catch (e) {
    quotes = {};
  }
  var yahooCount = Object.keys(quotes).length;

  // Yahoo can be rate-limited (429), so fill missing symbols from Stooq.
  var missingTickers = tickers.filter(function (ticker) {
    return !isFiniteNumber_(quotes[ticker]);
  });
  if (missingTickers.length) {
    var fallbackQuotes = fetchStooqQuotes_(missingTickers);
    Object.keys(fallbackQuotes).forEach(function (ticker) {
      quotes[ticker] = fallbackQuotes[ticker];
    });
  }
  var totalAfterFallback = Object.keys(quotes).length;
  var stooqCount = Math.max(totalAfterFallback - yahooCount, 0);
  var updatedCount = 0;

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var ticker = String(sheet.getRange(row, tickerIdx + 1).getValue() || '').toUpperCase().trim();
    var quotePrice = quotes[ticker];
    if (!isFiniteNumber_(quotePrice)) continue;

    var quantity = Number(sheet.getRange(row, quantityIdx + 1).getValue() || 0);
    var totalInvested = Number(sheet.getRange(row, totalInvestedIdx + 1).getValue() || 0);
    var marketValue = roundToScale_(quantity * quotePrice, 10);
    var unrealizedPnl = roundToScale_(marketValue - totalInvested, 10);
    var pnlPercent = totalInvested ? roundToScale_((unrealizedPnl / totalInvested) * 100, 10) : 0;

    sheet.getRange(row, currentPriceIdx + 1).setValue(quotePrice);
    if (marketValueIdx != null) sheet.getRange(row, marketValueIdx + 1).setValue(marketValue);
    if (unrealizedPnlIdx != null) sheet.getRange(row, unrealizedPnlIdx + 1).setValue(unrealizedPnl);
    if (pnlPercentIdx != null) sheet.getRange(row, pnlPercentIdx + 1).setValue(pnlPercent);
    updatedCount++;
  }

  return {
    updated: updatedCount,
    yahoo: yahooCount,
    stooq: stooqCount,
    missing: Math.max(tickers.length - totalAfterFallback, 0)
  };
}

function updateTransaction_(payload) {
  var sheet = getSheet_(SHEET_TRANSACTIONS);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idCol = headers.indexOf('id') + 1;
  if (idCol <= 0) throw new Error('No "id" column in Transactions sheet');

  var id = payload.id;
  if (!id) throw new Error('updateTransaction requires id');

  var type = (payload.type || '').toUpperCase();
  var quantity = Number(payload.quantity || 0);
  var price = parsePrice_(payload.price || 0);
  var total = roundToScale_(quantity * price, 10);

  var rowObj = {
    id: id,
    date: payload.date || '',
    type: type,
    asset_name: payload.asset_name || '',
    ticker: (payload.ticker || '').toUpperCase(),
    quantity: quantity,
    price: price,
    commission: Number(payload.commission || 0),
    currency: payload.currency || 'USD',
    total: total,
    notes: payload.notes || ''
  };

  for (var row = 2; row <= sheet.getLastRow(); row++) {
    var cellId = sheet.getRange(row, idCol).getValue();
    if (String(cellId) !== String(id)) continue;

    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      var val = rowObj[h];
      if (val !== undefined) {
        sheet.getRange(row, c + 1).setValue(val);
      }
    }
    return;
  }
}

// ---- Core Calculation Logic ----

function recalculatePortfolio_() {
  var txSheet = getSheet_(SHEET_TRANSACTIONS);
  var txRange = txSheet.getDataRange();
  var txValues = txRange.getValues();
  if (txValues.length < 2) {
    clearPortfolio_();
    return;
  }
  var headers = txValues[0];
  var rows = txValues.slice(1);

  var idx = {};
  headers.forEach(function (h, i) {
    idx[h] = i;
  });

  var byTicker = {};

  rows.forEach(function (row) {
    var type = String(row[idx.type] || '').toUpperCase();
    var ticker = String(row[idx.ticker] || '').toUpperCase();
    if (!ticker || (type !== 'BUY' && type !== 'SELL')) return;

    if (!byTicker[ticker]) {
      byTicker[ticker] = {
        asset_name: row[idx.asset_name] || '',
        currency: row[idx.currency] || 'USD',
        buys: [],
        sells: [],
        totalCommission: 0,
        realizedPnL: 0
      };
    }

    var qty = Number(row[idx.quantity] || 0);
    var price = Number(row[idx.price] || 0);
    var commission = Number(row[idx.commission] || 0);

    if (type === 'BUY') {
      byTicker[ticker].buys.push({ qty: qty, price: price, commission: commission });
    } else if (type === 'SELL') {
      byTicker[ticker].sells.push({ qty: qty, price: price, commission: commission });
    }
  });

  var portfolioRows = [];
  Object.keys(byTicker).forEach(function (ticker) {
    var pos = byTicker[ticker];
    var totalQty = 0;
    var totalCost = 0;

    pos.buys.forEach(function (b) {
      totalQty += b.qty;
      totalCost += b.qty * b.price + b.commission;
      pos.totalCommission += b.commission;
    });

    var avgPrice = totalQty ? totalCost / totalQty : 0;

    // Реализованный P&L и остаток позиции считаем по средневзвешенной цене
    var currentQty = totalQty;
    var realized = 0;

    pos.sells.forEach(function (s) {
      if (currentQty <= 0 || s.qty <= 0) return;
      realized += (s.price - avgPrice) * s.qty - s.commission;
      currentQty -= s.qty;
      pos.totalCommission += s.commission;
    });

    pos.realizedPnL = realized;

    var quantity = currentQty;
    if (quantity <= 0) {
      return;
    }

    var currentPrice = avgPrice;

    var totalInvested = avgPrice * quantity;
    var marketValue = currentPrice * quantity;
    var unrealizedPnL = marketValue - totalInvested;
    var pnlPercent = totalInvested ? (unrealizedPnL / totalInvested) * 100 : 0;

    portfolioRows.push({
      ticker: ticker,
      asset_name: pos.asset_name,
      currency: pos.currency,
      quantity: quantity,
      avg_buy_price: avgPrice,
      total_invested: totalInvested,
      current_price: currentPrice,
      market_value: marketValue,
      unrealized_pnl: unrealizedPnL,
      pnl_percent: pnlPercent
    });
  });

  writePortfolio_(portfolioRows);
}

function clearPortfolio_() {
  var sheet = getSheet_(SHEET_PORTFOLIO);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function writePortfolio_(rows) {
  var sheet = getSheet_(SHEET_PORTFOLIO);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (!rows.length) return;

  var values = rows.map(function (rowObj) {
    return headers.map(function (h) {
      return rowObj[h] !== undefined ? rowObj[h] : '';
    });
  });

  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function recalculateSummary_() {
  var portfolio = getPortfolio_();
  var dividends = getDividends_();
  var tx = getTransactions_();

  var totalInvested = 0; // суммарные вложения по BUY
  var totalMarketValue = 0;
  var totalUnrealizedPnL = 0;
  var totalRealizedPnL = 0;
  var totalCommissions = 0;
  var totalDividends = 0;

  // Текущая стоимость и нереализованный P&L только по открытым позициям
  portfolio.forEach(function (p) {
    totalMarketValue += Number(p.market_value || 0);
    totalUnrealizedPnL += Number(p.unrealized_pnl || 0);
  });

  // Считаем базу инвестиций и комиссии по всем транзакциям
  tx.forEach(function (t) {
    var type = String(t.type || '').toUpperCase();
    var qty = Number(t.quantity || 0);
    var price = Number(t.price || 0);
    var commission = Number(t.commission || 0);
    totalCommissions += commission;
    if (type === 'BUY') {
      totalInvested += qty * price;
    }
  });

  // Реализованный P&L считаем по SELL по средневзвешенной цене (average cost)
  // Строим историю по каждому тикеру
  var byTicker = {};
  tx.forEach(function (t) {
    var type = String(t.type || '').toUpperCase();
    var ticker = String(t.ticker || '').toUpperCase();
    if (!ticker || (type !== 'BUY' && type !== 'SELL')) return;
    if (!byTicker[ticker]) {
      byTicker[ticker] = { buys: [], sells: [] };
    }
    var qty = Number(t.quantity || 0);
    var price = Number(t.price || 0);
    var commission = Number(t.commission || 0);
    if (type === 'BUY') {
      byTicker[ticker].buys.push({ qty: qty, price: price, commission: commission });
    } else if (type === 'SELL') {
      byTicker[ticker].sells.push({ qty: qty, price: price, commission: commission });
    }
  });

  Object.keys(byTicker).forEach(function (ticker) {
    var pos = byTicker[ticker];
    var totalQty = 0;
    var totalCost = 0;

    pos.buys.forEach(function (b) {
      totalQty += b.qty;
      totalCost += b.qty * b.price + b.commission;
    });

    var avgPrice = totalQty ? totalCost / totalQty : 0;
    var currentQty = totalQty;

    pos.sells.forEach(function (s) {
      if (currentQty <= 0 || s.qty <= 0) return;
      totalRealizedPnL += (s.price - avgPrice) * s.qty - s.commission;
      currentQty -= s.qty;
    });
  });

  dividends.forEach(function (d) {
    totalDividends += Number(d.net_amount || d.amount || 0);
  });

  var sheet = getSheet_(SHEET_SUMMARY);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Общая доходность портфеля считаем только по реализованному P&L:
  // (реализованный P&L + дивиденды - комиссии) / вложения по BUY
  var totalReturnPercent =
    totalInvested > 0
      ? ((totalRealizedPnL + totalDividends - totalCommissions) / totalInvested) * 100
      : 0;

  var rowObj = {
    total_invested: totalInvested,
    total_market_value: totalMarketValue,
    total_unrealized_pnl: totalUnrealizedPnL,
    total_realized_pnl: totalRealizedPnL,
    total_commissions: totalCommissions,
    total_dividends: totalDividends,
    total_return_percent: totalReturnPercent
  };

  var row = headers.map(function (h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 1, headers.length).setValues([row]);
  } else {
    sheet.getRange(2, 1, 1, headers.length).setValues([row]);
  }
}

