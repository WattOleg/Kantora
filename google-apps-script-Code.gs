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

function getTxIndex_(headers) {
  var idx = {};
  headers.forEach(function (h, i) {
    idx[h] = i;
  });
  return idx;
}

function getOpenQuantityByTicker_(rows, idx, ticker, excludeId) {
  var target = String(ticker || '').toUpperCase();
  var qty = 0;
  rows.forEach(function (row) {
    if (!row || !row.length) return;
    var rowId = String(row[idx.id] || '');
    if (excludeId && rowId === String(excludeId)) return;
    var rowTicker = String(row[idx.ticker] || '').toUpperCase();
    if (rowTicker !== target) return;
    var type = String(row[idx.type] || '').toUpperCase();
    var q = Number(row[idx.quantity] || 0);
    if (type === 'BUY') qty += q;
    if (type === 'SELL') qty -= q;
  });
  return roundToScale_(Math.max(qty, 0), 10);
}

function addTransaction_(payload) {
  var sheet = getSheet_(SHEET_TRANSACTIONS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = getTxIndex_(headers);
  var allRows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : [];

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

  if ((type === 'BUY' || type === 'SELL') && quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if ((type === 'BUY' || type === 'SELL') && price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (type === 'SELL') {
    var availableQty = getOpenQuantityByTicker_(allRows, idx, ticker);
    if (availableQty <= 0) {
      throw new Error('No open position found for selected ticker');
    }
    if (quantity > availableQty) {
      throw new Error('Sell quantity exceeds available position: ' + availableQty);
    }
  }

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

function updateTransaction_(payload) {
  var sheet = getSheet_(SHEET_TRANSACTIONS);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var idx = getTxIndex_(headers);
  var idCol = headers.indexOf('id') + 1;
  if (idCol <= 0) throw new Error('No "id" column in Transactions sheet');

  var id = payload.id;
  if (!id) throw new Error('updateTransaction requires id');

  var type = (payload.type || '').toUpperCase();
  var quantity = Number(payload.quantity || 0);
  var price = parsePrice_(payload.price || 0);
  var total = roundToScale_(quantity * price, 10);
  var ticker = (payload.ticker || '').toUpperCase();

  if ((type === 'BUY' || type === 'SELL') && quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if ((type === 'BUY' || type === 'SELL') && price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (type === 'SELL') {
    var allRows = values.slice(1);
    var availableQty = getOpenQuantityByTicker_(allRows, idx, ticker, id);
    if (availableQty <= 0) {
      throw new Error('No open position found for selected ticker');
    }
    if (quantity > availableQty) {
      throw new Error('Sell quantity exceeds available position: ' + availableQty);
    }
  }

  var rowObj = {
    id: id,
    date: payload.date || '',
    type: type,
    asset_name: payload.asset_name || '',
    ticker: ticker,
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

function parseTxDate_(value) {
  var s = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '9999-12-31';
  return s;
}

function calculatePortfolioState_(rows, idx) {
  var tx = rows
    .map(function (row, i) {
      return {
        i: i,
        date: parseTxDate_(row[idx.date]),
        type: String(row[idx.type] || '').toUpperCase(),
        ticker: String(row[idx.ticker] || '').toUpperCase(),
        asset_name: row[idx.asset_name] || '',
        currency: row[idx.currency] || 'USD',
        qty: Number(row[idx.quantity] || 0),
        price: Number(row[idx.price] || 0),
        commission: Number(row[idx.commission] || 0)
      };
    })
    .filter(function (t) {
      return t.ticker && (t.type === 'BUY' || t.type === 'SELL');
    })
    .sort(function (a, b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return a.i - b.i;
    });

  var byTicker = {};
  tx.forEach(function (t) {
    if (!byTicker[t.ticker]) {
      byTicker[t.ticker] = {
        ticker: t.ticker,
        asset_name: t.asset_name || '',
        currency: t.currency || 'USD',
        qty: 0,
        cost: 0,
        realized: 0,
        commissions: 0
      };
    }
    var p = byTicker[t.ticker];
    if (t.asset_name) p.asset_name = t.asset_name;
    if (t.currency) p.currency = t.currency;
    p.commissions += t.commission;

    if (t.type === 'BUY') {
      p.qty += t.qty;
      p.cost += t.qty * t.price + t.commission;
      return;
    }

    if (t.type === 'SELL') {
      if (p.qty <= 0 || t.qty <= 0) return;
      var sellQty = Math.min(t.qty, p.qty);
      var avg = p.qty ? p.cost / p.qty : 0;
      var proceeds = sellQty * t.price - t.commission;
      var costBasis = avg * sellQty;
      p.realized += proceeds - costBasis;
      p.qty -= sellQty;
      p.cost -= costBasis;
      if (p.qty <= 0.0000000001) {
        p.qty = 0;
        p.cost = 0;
      }
    }
  });

  return byTicker;
}

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
  var idx = getTxIndex_(headers);
  var byTicker = calculatePortfolioState_(rows, idx);

  var portfolioRows = [];
  Object.keys(byTicker).forEach(function (ticker) {
    var pos = byTicker[ticker];
    var quantity = roundToScale_(pos.qty, 10);
    if (quantity <= 0) return;
    var totalInvested = roundToScale_(pos.cost, 10);
    var avgPrice = quantity ? roundToScale_(totalInvested / quantity, 10) : 0;
    var currentPrice = avgPrice;
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

  var headers = ['id', 'date', 'type', 'asset_name', 'ticker', 'quantity', 'price', 'commission', 'currency', 'total', 'notes'];
  var idx = getTxIndex_(headers);
  var txRows = tx.map(function (t) {
    return [
      t.id, t.date, t.type, t.asset_name, t.ticker, t.quantity, t.price, t.commission, t.currency, t.total, t.notes
    ];
  });
  var byTicker = calculatePortfolioState_(txRows, idx);
  Object.keys(byTicker).forEach(function (ticker) {
    totalRealizedPnL += Number(byTicker[ticker].realized || 0);
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

