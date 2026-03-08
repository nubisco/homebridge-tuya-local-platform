# Known Issues

## Unsupported Devices

- **Sensor-only devices** (motion sensors, door/window sensors) are not supported. These devices do not respond reliably to LAN polling and typically require cloud push notifications.

## Protocol Limitations

- Protocol version **3.5** is not currently supported.
- Some newer Tuya devices may use protocol versions or encryption methods not yet implemented.

## Single Connection Limit

Tuya devices allow only one LAN connection at a time. If another app or plugin is connected to the device, this plugin will not be able to communicate with it.

## DataPoint Mapping

- DP mappings vary between manufacturers, even for the same device type. The default mappings may not work for all devices.
- Some devices report DPs in unexpected formats. Check the Homebridge log output to identify the correct DP numbers for your device.

## Adaptive Lighting

- Adaptive Lighting is only supported on `RGBTWLight`, `TWLight`, and `OilDiffuser` types.
- Requires Homebridge >= 1.6.0 and a compatible Home app.
