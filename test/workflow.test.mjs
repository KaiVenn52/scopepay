import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server.mjs';

test('HTTP workflow persists approval, prevents duplicate invoices, distinguishes partial from paid and survives restart', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-test-'));
  let server;
  const start = async env => { server = await createApp({ directory, env }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}`; };
  let base = await start({});
  const post = async (route, body, headers = {}) => { const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); return { status: response.status, body: await response.json() }; };
  try {
    let result = await post('/api/reviews', { scope: 'A five-page website. No store.', request: 'Add a store.' }); assert.equal(result.status, 200);
    const id = result.body.id, item = result.body.items[0].id, route = `/api/reviews/${id}`;
    assert.equal((await post(`${route}/invoice`, {})).status, 409);
    const input = { confirmed: true, recipient: 'buyer@example.test', items: [{ id: item, amount: '200.25' }] };
    const approvalResults = await Promise.all([post(`${route}/approve`, input), post(`${route}/approve`, input)]);
    assert.deepEqual(approvalResults.map(result => result.status).sort(), [200, 409]);
    assert.equal((await post(`${route}/invoice`, {})).status, 409);
    const reviewed = approvalResults.find(result => result.status === 200).body;
    const publicProposal = await (await fetch(`${base}/api/proposals/${reviewed.proposalToken}`)).json();
    assert.equal(publicProposal.scope, undefined); assert.equal(publicProposal.request, undefined);
    assert.equal((await post(`/api/proposals/${reviewed.proposalToken}/respond`, { name: 'Example Client', decision: 'accepted', confirmed: true, hash: 'wrong-revision' })).status, 409);
    assert.equal((await post(`/api/proposals/${reviewed.proposalToken}/respond`, { name: 'Example Client', decision: 'accepted', confirmed: true, hash: reviewed.approval.hash })).status, 200);
    assert.equal((await post(`/api/proposals/${reviewed.proposalToken}/respond`, { name: 'Example Client', decision: 'accepted', confirmed: true, hash: reviewed.approval.hash })).status, 409);
    const creates = await Promise.all([post(`${route}/invoice`, {}), post(`${route}/invoice`, {})]);
    assert.equal(creates[0].body.invoice.id, creates[1].body.invoice.id);
    assert.equal(creates[1].body.events.filter(event => event.action === 'invoice').length, 1);
    assert.equal((await post(`${route}/simulate`, { status: 'PAID' })).status, 409);
    assert.equal((await post(`${route}/send`, {})).body.invoice.status, 'SENT');
    assert.equal((await post(`${route}/simulate`, { status: 'PARTIALLY_PAID' })).body.invoice.settled, false);
    assert.equal((await post(`${route}/simulate`, { status: 'PAYMENT_PENDING' })).body.invoice.settled, false);
    assert.equal((await post(`${route}/simulate`, { status: 'PAID' })).body.invoice.settled, true);
    assert.equal((await post(`${route}/refresh`, {}, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await post('/api/reviews', { scope: '', request: 'x' })).status, 400);
    await new Promise(resolve => server.close(resolve)); base = await start({});
    const saved = await (await fetch(base + '/api/state')).json(); assert.equal(saved.records[0].approval.totalCents, 20025); assert.equal(saved.records[0].invoice.status, 'PAID');
    await new Promise(resolve => server.close(resolve)); base = await start({ PAYPAL_MODE: 'sandbox' });
    assert.equal((await post(`${route}/simulate`, { status: 'PAID' })).status, 409);
  } finally { if (server?.listening) await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
});

test('uncertain sandbox creation is blocked from retry, including after restart', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-uncertain-'));
  const env = { PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test', PAYPAL_MERCHANT_EMAIL: 'test@example.test' };
  let calls = 0;
  const fetcher = async url => { calls++; if (url.endsWith('/token')) return Response.json({ access_token: 'test-only' }); throw new Error('network timeout'); };
  let server = await createApp({ directory, env, fetcher });
  const listen = async () => { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}`; };
  let base = await listen();
  const post = async (route, body) => { const res = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: res.status, body: await res.json() }; };
  try {
    const { body: review } = await post('/api/reviews', { scope: 'No store.', request: 'Add a store.' }); const route = `/api/reviews/${review.id}`;
    const { body: approved } = await post(`${route}/approve`, { confirmed: true, recipient: 'buyer@example.test', items: [{ id: review.items[0].id, amount: '1.00' }] });
    await post(`/api/proposals/${approved.proposalToken}/respond`, { name: 'Example Client', decision: 'accepted', confirmed: true, hash: approved.approval.hash });
    assert.equal((await post(`${route}/invoice`, {})).status, 500); const count = calls;
    assert.equal((await post(`${route}/invoice`, {})).status, 409); assert.equal(calls, count);
    await new Promise(resolve => server.close(resolve)); server = await createApp({ directory, env, fetcher }); base = await listen();
    assert.equal((await post(`${route}/invoice`, {})).status, 409); assert.equal(calls, count);
  } finally { if (server.listening) await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
});
