import { APPS_SCRIPT_URL } from '../config';

function buildActionUrl(action) {
  const url = new URL(APPS_SCRIPT_URL, window.location.origin);
  url.searchParams.set('action', action);
  return url.toString();
}

function isProxyUrl() {
  return APPS_SCRIPT_URL.startsWith('/');
}

async function postAction(action, payload = {}) {
  const body = JSON.stringify({ action, ...payload });
  const headers = isProxyUrl()
    ? { 'Content-Type': 'application/json' }
    : { 'Content-Type': 'text/plain;charset=utf-8' };

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body
  });
  return handleResponse(res);
}

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
  const res = await fetch(buildActionUrl('getData'), { cache: 'no-store' });
  return handleResponse(res);
}

export async function getTransactions() {
  const res = await fetch(buildActionUrl('getTransactions'));
  return handleResponse(res);
}

export async function getPortfolio() {
  const res = await fetch(buildActionUrl('getPortfolio'));
  return handleResponse(res);
}

export async function getSummary() {
  const res = await fetch(buildActionUrl('getSummary'));
  return handleResponse(res);
}

export async function getDividends() {
  const res = await fetch(buildActionUrl('getDividends'));
  return handleResponse(res);
}

export async function addTransaction(payload) {
  return postAction('addTransaction', payload);
}

export async function addDividend(payload) {
  return postAction('addDividend', payload);
}

export async function updateDividend(payload) {
  return postAction('updateDividend', payload);
}

export async function deleteDividend(id) {
  return postAction('deleteDividend', { id });
}

export async function deleteTransaction(id) {
  return postAction('deleteTransaction', { id });
}

export async function updatePortfolioPrice(ticker, current_price) {
  return postAction('updatePortfolioPrice', { ticker, current_price });
}

export async function updateTransaction(payload) {
  return postAction('updateTransaction', payload);
}

export async function syncPortfolioPrices() {
  return postAction('syncPortfolioPrices', { ts: Date.now() });
}

