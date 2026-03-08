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
| `ip`           | No       | Static IP address (only if auto-discovery fails)                      |
| `manufacturer` | No       | Manufacturer name shown in HomeKit                                    |
| `model`        | No       | Model name shown in HomeKit                                           |
| `version`      | No       | Tuya protocol version (`3.1`, `3.3`, or `3.4`)                        |

::: tip
The `type` value is case-insensitive. `"SimpleLight"`, `"simplelight"`, and `"SIMPLELIGHT"` all work.
:::

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
