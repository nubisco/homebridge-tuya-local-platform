# Homebridge Tuya Local Platform

![logos](docs/public/logos.png)

[![CI](https://github.com/nubisco/homebridge-tuya-local-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/nubisco/homebridge-tuya-local-platform/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/nubisco/homebridge-tuya-local-platform)](https://github.com/nubisco/homebridge-tuya-local-platform/releases)
[![npm version](https://img.shields.io/npm/v/@nubisco/homebridge-tuya-local-platform)](https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform)
[![Coverage](https://codecov.io/gh/nubisco/homebridge-tuya-local-platform/graph/badge.svg)](https://codecov.io/gh/nubisco/homebridge-tuya-local-platform)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-339933)](https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform)
[![Homebridge](https://img.shields.io/badge/homebridge-%3E%3D1.6.0-blue)](https://homebridge.io)
[![license](https://img.shields.io/npm/l/@nubisco/homebridge-tuya-local-platform)](LICENSE)
[![Docs](https://img.shields.io/website?url=https%3A%2F%2Fnubisco.github.io%2Fhomebridge-tuya-local-platform%2F&label=docs)](https://nubisco.github.io/homebridge-tuya-local-platform/)

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

## Features

- **Local Control**: Communicate directly with Tuya devices over LAN without cloud dependency
- **23 Device Types**: Support for outlets, lights, dimmers, fans, sensors, climate control, and more
- **Energy Monitoring**: Track power consumption on compatible devices
- **Automatic Discovery**: UDP discovery finds devices on your local network
- **Flexible Configuration**: Override DataPoints (DPs) and customize device behavior
- **TypeScript**: Fully typed codebase with comprehensive testing

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and pull request guidelines.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md) for responsible disclosure procedures.

## Support / Sponsorship

If you find this plugin useful, consider:

- Starring the repository on [GitHub](https://github.com/nubisco/homebridge-tuya-local-platform)
- Contributing device support, bug fixes, or documentation improvements
- Sponsoring maintenance via [GitHub Sponsors](https://github.com/sponsors/joseporto)

## License

[MIT](LICENSE)
