# Verified local semantic AI

ScopePay includes an actual CPU feature-extraction model, independent of a hosted AI account or paid inference API. The model retrieves relevant source clauses. It does not generate a contract interpretation or an invoice price.

| Field | Value |
| --- | --- |
| Model | `Xenova/all-MiniLM-L6-v2` |
| Immutable revision | `751bff37182d3f1213fa05d7196b954e230abad9` |
| Runtime | `@huggingface/transformers` 3.8.1, ONNX Runtime Node, CPU, two intra-op threads |
| Quantization | q8 (`model_quantized.onnx`) |
| Embeddings | 384 dimensions, mean pooling, normalized |
| Retrieval | Cosine ranking across scope clauses for each request |
| Local cached assets | 23,685,047 bytes in the verified run |
| Model license | Apache-2.0; [model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2) |
| Upstream | [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) |
| Primary API documentation | [Hugging Face pipeline API](https://huggingface.co/docs/transformers.js/en/pipelines) |

The source document is split into exact sentence/line passages and bounded chunks. Decimal amounts are preserved. Up to 80 scope passages and 12 request passages are supported; excess requests are rejected explicitly. The model receives all passages locally, encodes them, and ranks the source matches for each request. Quotes are validated again against the original source. Scores and the top three matches are preserved in the record; the UI shows the strongest quotation and expandable alternatives. Numerical scores stay in the analysis record rather than being presented as confidence.

All findings remain `unclear`, deliberately. The same topic can be included or explicitly excluded, and embeddings cannot establish logical entailment. A high similarity can therefore identify a relevant exclusion rather than an included deliverable. Low similarity can miss a paraphrase. Whole-document context still matters. Review each quoted clause and the entire agreement. The model is English-oriented; this prototype does not claim multilingual contract comprehension.

Actual verification found the store and Calendly requests closest to the supplied store/booking exclusion and the headline request closest to the supplied two-round copy revision clause. These three synthetic cases establish execution and useful retrieval in that example; they are not a measured general accuracy benchmark.

Run `npm.cmd run verify:ai` once to download and verify assets; run `npm.cmd run verify:ai -- --cached-only` to repeat from the local cache. `npm.cmd run start:ai` loads only cached assets. Client source text is processed in this Node process and not sent to a hosted inference service. The first setup contacts Hugging Face only for public model assets. No model weights are committed or included in the source manifest; their hashes are recorded in [real model evidence](../evidence/real-ai-verification.json).

Ollama remains an optional generative comparison adapter. No actual Ollama run is claimed. Offline mode remains available and makes no AI claim. These three modes must stay visibly distinct.

PayPal sandbox acceptance and payment remain separate proof gates.

## v0.4.1 setup integrity

The public `lib/model-assets.json` pins byte sizes and SHA-256 for the four assets of the fixed model revision. Setup verifies existing cache bytes, downloads absent/corrupt files to unique temporary files, limits each attempt to 60 seconds and at most two attempts, and promotes a file only after its size and digest match. A failed repair cannot publish a truncated replacement. Model execution uses local-only pipeline loading after validation. This protects setup integrity; it does not establish model accuracy or contractual correctness.
