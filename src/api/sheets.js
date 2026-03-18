import { APPS_SCRIPT_URL } from '../config';

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  const json = await response.json();
  if (json && (json.error || json.status === 'error')) {
    throw new Error(json.message || json.error || 'Ошибка при запросе к Google Apps Script');
  }
  return json;
}

export async function getData() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
  return handleResponse(res);
}

export async function getTransactions() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getTransactions`);
  return handleResponse(res);
}

export async function getPortfolio() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getPortfolio`);
  return handleResponse(res);
}

export async function getSummary() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getSummary`);
  return handleResponse(res);
}

export async function getDividends() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getDividends`);
  return handleResponse(res);
}

export async function addTransaction(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    // text/plain позволяет избежать CORS preflight для Google Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'addTransaction', ...payload })
  });
  return handleResponse(res);
}

export async function addDividend(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'addDividend', ...payload })
  });
  return handleResponse(res);
}

export async function updateDividend(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updateDividend', ...payload })
  });
  return handleResponse(res);
}

export async function deleteDividend(id) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'deleteDividend', id })
  });
  return handleResponse(res);
}

export async function deleteTransaction(id) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'deleteTransaction', id })
  });
  return handleResponse(res);
}

export async function updatePortfolioPrice(ticker, current_price) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updatePortfolioPrice', ticker, current_price })
  });
  return handleResponse(res);
}

export async function updateTransaction(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updateTransaction', ...payload })
  });
  return handleResponse(res);
}

