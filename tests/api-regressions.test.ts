import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getApiErrorMessage, getCustomers, getPurchases, getProducts, loginAdmin } from '../src/lib/api';

test('API errors always produce renderable strings, including nested validation errors', () => {
  assert.equal(getApiErrorMessage({ error: { message: 'Validation failed' } }, 'fallback'), 'Validation failed');
  assert.equal(getApiErrorMessage({ error: 'Duplicate username' }, 'fallback'), 'Duplicate username');
  assert.equal(getApiErrorMessage({ message: 'Disabled' }, 'fallback'), 'Disabled');
  assert.equal(getApiErrorMessage({ error: { issues: [] } }, 'fallback'), 'fallback');
  assert.equal(getApiErrorMessage(null, 'fallback'), 'fallback');
});

test('CMS maps backend customer spending and purchase receipt numbers', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ data: [{ id: 'customer', total_spending: '125000.00' }] });
    assert.equal((await getCustomers('restoran'))[0].total_spent, '125000.00');
    globalThis.fetch = async () => Response.json({ data: [{ id: 'purchase', receipt_number: 'INV-001' }] });
    assert.equal((await getPurchases('restoran'))[0].invoice_number, 'INV-001');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('login helper rejects unsuccessful HTTP responses', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: { message: 'Invalid credentials' } }, { status: 401 });
    await assert.rejects(loginAdmin('test-user', 'invalid'), /Invalid credentials/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('inventory category selection filters products even when the API returns all categories', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ data: [
      { id: 'coffee', category_id: 'drinks', category_name: 'Minuman' },
      { id: 'rice', category_id: 'food', category_name: 'Makanan' },
    ] });
    assert.deepEqual((await getProducts('restoran', 'Minuman')).map(product => product.id), ['coffee']);
    assert.deepEqual((await getProducts('restoran', 'food')).map(product => product.id), ['rice']);
    assert.equal((await getProducts('restoran')).length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
