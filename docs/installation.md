# Installation

## Option 1: Homebridge Config UI X

1. Open the Homebridge UI.
2. Go to **Plugins**.
3. Search for `@nubisco/homebridge-tuya-local-platform`.
4. Click **Install**.
5. Restart Homebridge.

## Option 2: Manual (npm)

```bash
npm install -g @nubisco/homebridge-tuya-local-platform
```

Restart Homebridge after installation.

## Verify Installation

Check that the plugin is registered:

```bash
npm list -g @nubisco/homebridge-tuya-local-platform
```

## Upgrading from `homebridge-tuya` / `TuyaLan`

If you previously used the `homebridge-tuya` plugin with `"platform": "TuyaLan"`:

1. Uninstall the old plugin.
2. Install this plugin.
3. Update your `config.json` — change `"platform": "TuyaLan"` to `"platform": "TuyaLocalPlatform"`.
4. Restart Homebridge.

All device configurations remain compatible.
