# Third-party notices

ScopePay application source is provided under the MIT license in `LICENSE`. Third-party software and model assets retain their own licenses.

- Transformers.js (`@huggingface/transformers`, pinned 3.8.1): [Apache-2.0 project](https://github.com/huggingface/transformers.js).
- ONNX Runtime and transitive npm dependencies: consult their included package license files and the exact resolved versions in `package-lock.json`.
- `Xenova/all-MiniLM-L6-v2`: [Apache-2.0 model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2), ONNX conversion of [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). ScopePay downloads this model locally at pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`; the ignored cache is not part of the source distribution.
- Playwright (`@playwright/test`): [Apache-2.0 project](https://github.com/microsoft/playwright), development verification only.

No PayPal source code, logos, or screenshots are bundled. PayPal is named to identify the integration platform. No third-party music, generated imagery, or stock media are used.
