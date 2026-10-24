import { loadEmbeddingModel, MODEL } from '../lib/semantic.mjs';
import { createApp } from '../server.mjs';

process.env.AI_MODE = 'local-embeddings';
console.log(`Loading local semantic AI: ${MODEL}. Model assets must already be cached (npm.cmd run verify:ai).`);
await loadEmbeddingModel({ localOnly: true });
const server = await createApp();
const port = Number(process.env.PORT || 3186);
server.listen(port, '127.0.0.1', () => console.log(`ScopePay: http://127.0.0.1:${port} | AI=real local semantic retrieval | PayPal=${process.env.PAYPAL_MODE || 'mock'}`));
