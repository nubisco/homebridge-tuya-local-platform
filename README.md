# Homebridge Tuya Local Platform

![logos](docs/public/logos.png)

[![npm](https://img.shields.io/npm/v/@nubisco/homebridge-tuya-local-platform.svg)](https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform)
[![license](https://img.shields.io/npm/l/@nubisco/homebridge-tuya-local-platform.svg)](LICENSE)

Control Tuya-based smart devices locally over LAN through Apple HomeKit — no cloud dependency required.

## Quick Start

```bash
npm install -g @nubisco/homebridge-tuya-local-platform
```

Add to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "TuyaLocalPlatform",
      "devices": [
        {
          "name": "My Light",
          "type": "SimpleLight",
          "id": "<device-id>",
          "key": "<local-key>"
        }
      ]
    }
  ]
}
```

## Documentation

Full documentation is available at **[nubisco.github.io/homebridge-tuya-local-platform](https://nubisco.github.io/homebridge-tuya-local-platform/)**, including:

- [Installation](https://nubisco.github.io/homebridge-tuya-local-platform/installation)
- [Getting Local Keys](https://nubisco.github.io/homebridge-tuya-local-platform/get-local-keys)
- [Configuration](https://nubisco.github.io/homebridge-tuya-local-platform/configuration)
- [Supported Device Types](https://nubisco.github.io/homebridge-tuya-local-platform/#supported-device-types)
- [Troubleshooting](https://nubisco.github.io/homebridge-tuya-local-platform/troubleshooting)

## License

[MIT](LICENSE)
