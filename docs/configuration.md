# Configuration

Add the plugin to the `platforms` array in your Homebridge `config.json`.

## Minimal Example

```json
{
  "platforms": [
    {
      "platform": "TuyaLocalPlatform",
      "devices": [
        {
          "name": "Hallway Light",
          "type": "SimpleLight",
          "id": "011233455677899abbcd",
          "key": "0123456789abcdef"
        }
      ]
    }
  ]
}
```

## Device Parameters

| Parameter      | Required | Description                                                           |
| -------------- | -------- | --------------------------------------------------------------------- |
| `name`         | Yes      | Friendly name shown in HomeKit                                        |
| `type`         | Yes      | Device type identifier (see [Supported Device Types](./device-types)) |
| `id`           | Yes      | Tuya Device ID                                                        |
| `key`          | Yes      | Local Key for LAN communication                                       |
| `ip`           | No       | Static IP address (skips auto-discovery when `version` is also set)   |
| `manufacturer` | No       | Manufacturer name shown in HomeKit                                    |
| `model`        | No       | Model name shown in HomeKit                                           |
| `version`      | No       | Tuya protocol version (`3.1`, `3.3`, or `3.4`)                        |
| `disabled`     | No       | Skip this device and remove it from HomeKit, keeping its config       |

::: tip
The `type` value is case-insensitive. `"SimpleLight"`, `"simplelight"`, and `"SIMPLELIGHT"` all work.
:::

::: tip Skipping discovery
A device configured with **both** `ip` and `version` is connected immediately, and is left out
of UDP discovery entirely. If every device is configured that way, discovery never runs.

Set `version` as well as `ip` if your devices are on a different subnet from Homebridge.
Discovery uses UDP broadcasts, which routers do not forward, so those devices can never be
discovered. With only `ip` set, the plugin still waits out the discovery window first,
because discovery is where the protocol version would otherwise come from.
:::

## Temporarily Disabling a Device

Set `disabled` to skip a device without deleting the configuration you had to work to
obtain:

```json
{
  "type": "Outlet",
  "name": "Holiday Lights",
  "id": "xxxxxxxxxxxxxxxxxxxx",
  "key": "xxxxxxxxxxxxxxxx",
  "ip": "192.168.0.120",
  "version": "3.3",
  "disabled": true
}
```

A disabled device is left out of discovery, is never connected to, and its cached accessory
is removed from HomeKit on the next restart. Nothing about it is retried, so it produces no
reconnect messages while it is off.

Clear the flag and restart to bring it back.

## Multiple Devices

Add multiple entries to the `devices` array:

```json
{
  "platforms": [
    {
      "platform": "TuyaLocalPlatform",
      "devices": [
        {
          "name": "Living Room Light",
          "type": "RGBTWLight",
          "id": "aabbccdd11223344",
          "key": "1234567890abcdef"
        },
        {
          "name": "Bedroom Dehumidifier",
          "type": "Dehumidifier",
          "id": "eeff00112233aabb",
          "key": "fedcba0987654321"
        }
      ]
    }
  ]
}
```

## Device-Specific Options

Some device types accept additional context parameters. See the [Supported Device Types](./device-types) page for details.
