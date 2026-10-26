# Third-party notices

ScopePay application source is provided under the MIT license in `LICENSE`. Third-party software and model assets retain their own licenses.

- Transformers.js (`@huggingface/transformers`, pinned 3.8.1): [Apache-2.0 project](https://github.com/huggingface/transformers.js).
- ONNX Runtime and transitive npm dependencies: consult their included package license files and the exact resolved versions in `package-lock.json`.
- `Xenova/all-MiniLM-L6-v2`: [Apache-2.0 model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2), ONNX conversion of [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). ScopePay downloads this model locally at pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`; the ignored cache is not part of the source distribution.
- Playwright (`@playwright/test`): [Apache-2.0 project](https://github.com/microsoft/playwright), development verification only.

The application uses the PayPal name to identify its integration platform, not to claim sponsorship or endorsement. Dated verification evidence may show the actual event or sandbox interface. No PayPal source code or standalone logo asset, third-party music, generated imagery, or stock media is used in the application.

The text-only retrieval runtime transitively includes sharp (Apache-2.0). It is overridden to patched version 0.35.5; resolved native optional packages are recorded in package-lock.json. ScopePay does not accept image uploads or expose image-decoding routes.
