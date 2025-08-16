# Weather Radar – API Keys (Private)

To enable Bing and optional MapTiler/Google tiles:

1) Copy `public/config.sample.json` to `public/config.local.json` (gitignored).
2) Fill in your real keys in `config.local.json`.
3) Start the app; keys are loaded at runtime on the client and used for Bing, etc.

Notes:

- `public/config.local.json` stays local and private (ignored by git).
- Without a Bing key, the app falls back to ESRI/Google sources.
