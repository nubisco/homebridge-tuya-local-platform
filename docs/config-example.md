# Configuration Examples

## Simple Light

```json
{
  "platform": "TuyaLocalPlatform",
  "devices": [
    {
      "name": "Living Room Light",
      "type": "SimpleLight",
      "id": "0123456789abcdef",
      "key": "abcdef0123456789"
    }
  ]
}
```

## RGB + Tunable White Light

```json
{
  "platform": "TuyaLocalPlatform",
  "devices": [
    {
      "name": "Bedroom Lamp",
      "type": "RGBTWLight",
      "id": "aabbccdd11223344",
      "key": "1234567890abcdef",
      "manufacturer": "LIFX",
      "model": "Color Bulb"
    }
  ]
}
```

## Dehumidifier with Custom DPs

```json
{
  "platform": "TuyaLocalPlatform",
  "devices": [
    {
      "name": "Basement Dehumidifier",
      "type": "Dehumidifier",
      "id": "eeff00112233aabb",
      "key": "fedcba0987654321",
      "dpPower": "1",
      "dpMode": "2",
      "dpCurrentHumidity": "6",
      "dpTargetHumidity": "4"
    }
  ]
}
```

## Mapped Heat Pump Heater

```json
{
  "platform": "TuyaLocalPlatform",
  "devices": [
    {
      "name": "Heat Pump",
      "type": "MappedHeatPumpHeater",
      "id": "11223344aabbccdd",
      "key": "abcd1234efgh5678",
      "manufacturer": "Ferroli",
      "model": "Omnia S 3.2"
    }
  ]
}
```

## Circuit Breaker Monitor

```json
{
  "platform": "TuyaLocalPlatform",
  "devices": [
    {
      "name": "Main Panel Monitor",
      "type": "CircuitBreakerMonitor",
      "id": "44556677aabbccdd",
      "key": "efgh5678abcd1234",
      "dpSwitch": "1",
      "dpTemperature": "9"
    }
  ]
}
```
