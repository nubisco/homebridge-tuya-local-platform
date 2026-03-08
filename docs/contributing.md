# Contributing

Contributions are welcome! This project is written in TypeScript and builds to `dist/`.

## Development Setup

```bash
git clone https://github.com/nubisco/homebridge-tuya-local-platform.git
cd homebridge-tuya-local-platform
npm install
npm run dev   # watch mode
```

## Adding a New Device Type

1. Create a new accessory file in `src/` extending `BaseAccessory`.
2. Implement `_registerPlatformAccessory()` and the relevant HomeKit service/characteristic bindings.
3. Register the type in `src/index.ts` by adding it to the `CLASS_DEF` map.
4. Document the DP mappings.
5. Open a pull request.

## Code Style

- TypeScript with strict mode.
- 2-space indentation.
- Run `npm run build` to verify compilation before submitting.

## Reporting Issues

When opening an issue, include:

- Homebridge version
- Node.js version
- Plugin version
- Device type and manufacturer
- Relevant Homebridge log output
