# Introduction

Control Tuya-based smart devices locally over LAN through Apple HomeKit.

`@nubisco/homebridge-tuya-local-platform` communicates directly with Tuya devices on your local network using their Device ID and Local Key — no cloud dependency required.

## Features

- **Local LAN control** — no Tuya cloud needed after initial key extraction
- **Wide device support** — 23 device type handlers covering most Tuya-based products
- **Apple HomeKit integration** — full support via Homebridge
- **Adaptive Lighting** — supported on compatible light accessories
- **Energy monitoring** — power, voltage, and current readings on supported outlets
- **Multi-protocol** — supports Tuya protocol versions 3.1, 3.3, and 3.4

## Supported Device Types

| Type ID                 | Device Category    | Description                                               |
| ----------------------- | ------------------ | --------------------------------------------------------- |
| `AirConditioner`        | Climate            | Heat/cool/auto modes with fan speed control               |
| `AirPurifier`           | Climate            | Purifier with fan speed (Breville, Proscenic, Siguro)     |
| `CircuitBreakerMonitor` | Energy             | Read-only circuit breaker telemetry and safety monitoring |
| `Convector`             | Climate            | Heater/cooler with LOW/HIGH fan speed                     |
| `CustomMultiOutlet`     | Outlet             | Config-driven multi-outlet with custom DP mapping         |
| `Dehumidifier`          | Climate            | Dehumidifier with target humidity and fan speed           |
| `Fan`                   | Fan                | Fan with rotation speed control                           |
| `FanLight`              | Fan + Light        | Combined fan with lightbulb                               |
| `GarageDoor`            | Garage             | Garage door opener with state tracking                    |
| `MappedHeatPumpHeater`  | Climate            | Heat pump with virtual room-to-water temperature mapping  |
| `MultiOutlet`           | Outlet             | Multi-outlet with debounced power switching               |
| `OilDiffuser`           | Humidifier + Light | Oil diffuser with humidifier and RGB light                |
| `Outlet`                | Outlet             | Single outlet with optional energy monitoring             |
| `RGBTWLight`            | Light              | Full RGB + tunable white with adaptive lighting           |
| `RGBTWOutlet`           | Outlet + Light     | Outlet combined with RGBTW light                          |
| `SimpleBlinds`          | Window Covering    | Time-based blind position tracking                        |
| `SimpleDimmer`          | Light              | Lightbulb with brightness control                         |
| `SimpleDimmer2`         | Light              | Alternative dimmer (DP 3 brightness)                      |
| `SimpleHeater`          | Climate            | Basic heater/cooler                                       |
| `SimpleLight`           | Light              | Basic on/off lightbulb                                    |
| `Switch`                | Switch             | Multi-switch with debounced power                         |
| `TWLight`               | Light              | Tunable white with adaptive lighting                      |
| `WaterValve`            | Valve              | Valve with timer support                                  |

See [Supported Device Types](./device-types) for detailed configuration parameters and examples for each device.

## Requirements

- **Node.js** >= 18.0.0
- **Homebridge** >= 1.6.0
- Tuya device **Local Key** (see [Getting Local Keys](./get-local-keys))
