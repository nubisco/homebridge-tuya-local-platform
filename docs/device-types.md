# Supported Device Types

This is the current list of supported device types that work with this plugin. Each type corresponds to a value you set in the `type` field of your device configuration.

If you are looking for verified configurations for your specific device, see the [Configuration Examples](./config-example).

## Device Type Reference

| Device                               |        Type         | Notes                                                                                                   |
| :----------------------------------- | :-----------------: | :------------------------------------------------------------------------------------------------------ |
| Smart Plug                           |      `Outlet`       | Smart plugs that just turn on and off ([details](#outlets))                                             |
| Smart Light Bulb Socket              |    `SimpleLight`    | Light sockets that just turn on and off                                                                 |
| Simple Light Bulb                    |    `SimpleLight`    | Light bulbs that just turn on and off                                                                   |
| Tunable White Light Bulb             |      `TWLight`      | Bulbs with tunable white and dimming functionality ([details](#tunable-white-light-bulbs))              |
| White and Color Light Bulb           |    `RGBTWLight`     | Colored bulbs with tunable white and dimming ([details](#white-and-color-light-bulbs))                  |
| Smart Power Strip                    |    `MultiOutlet`    | Power strips with sequential data-points for individual outlet control ([details](#smart-power-strips)) |
| Non-sequential Power Strip           | `CustomMultiOutlet` | Power strips with non-sequential data-points per outlet ([details](#non-sequential-power-strips))       |
| Barely Smart Power Strip             |      `Outlet`       | Power strips that don't allow individual control of the outlets                                         |
| Air Conditioner                      |  `AirConditioner`   | Cooling and heating devices ([details](#air-conditioners))                                              |
| Heat Convector                       |     `Convector`     | Heating panels ([details](#heat-convectors))                                                            |
| Simple Dimmer                        |   `SimpleDimmer`    | Dimmer switches with power control ([details](#simple-dimmers))                                         |
| Simple Heater                        |   `SimpleHeater`    | Heating solutions with only temperature control ([details](#simple-heaters))                            |
| Garage Door                          |    `GarageDoor`     | Smart garage doors or garage door openers ([details](#garage-doors))                                    |
| Simple Blinds                        |   `SimpleBlinds`    | Smart blinds and smart switches that control blinds ([details](#simple-blinds))                         |
| Simple Blinds 2                      |   `SimpleBlinds2`   | Alternate blinds implementation — use if `SimpleBlinds` doesn't work ([details](#simple-blinds))        |
| Smart Plug w/ White and Color Lights |    `RGBTWOutlet`    | Smart plugs with controllable RGBTW LEDs ([details](#outlets-with-white-and-color-lights))              |
| Smart Fan Regulator                  |        `Fan`        | Fan regulators with controllable speeds ([details](#smart-fan-regulators))                              |
| Smart Fan with Light                 |     `FanLight`      | Fan devices with controllable speeds, direction, and built-in light ([details](#smart-fan-with-light))  |

::: tip
The `type` value is case-insensitive. `"SimpleLight"`, `"simplelight"`, and `"SIMPLELIGHT"` all work.
:::

## Device Configuration Details

### Outlets

These are plugs with a single outlet that can only be turned on or off.

```json5
{
  name: 'My Outlet',
  type: 'Outlet',
  manufacturer: 'EZH',
  model: 'Wifi Mini Smart Life Outlet',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* If your device provides energy parameters, define these */

  /* Datapoint identifier for voltage reporting */
  voltsId: 9,

  /* Datapoint identifier for amperage reporting */
  ampsId: 8,

  /* Datapoint identifier for wattage reporting */
  wattsId: 7,

  /* Often voltage is reported divided by 10; if that is
     not the case for you, override the default */
  voltsDivisor: 10,

  /* Often amperage is reported divided by 1000; if that is
     not the case for you, override the default */
  ampsDivisor: 1000,

  /* Often wattage is reported divided by 10; if that is
     not the case for you, override the default */
  wattsDivisor: 10,

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for power */
  dpPower: 1,
}
```

### Tunable White Light Bulbs

These are light bulbs that let you control the brightness and tune the bulb's light from warm white to daylight white.

```json5
{
  name: 'My Tunable White Bulb',
  type: 'TWLight',
  manufacturer: 'Iotton',
  model: 'Smart White Bulb',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for power */
  dpPower: 1,

  /* Override the default datapoint identifier for brightness */
  dpBrightness: 2,

  /* Override the default datapoint identifier for color-temperature */
  dpColorTemperature: 3,

  /* Minimum white temperature mired value
     (See https://en.wikipedia.org/wiki/Mired) */
  minWhiteColor: 140,

  /* Maximum white temperature mired value */
  maxWhiteColor: 400,
}
```

### White and Color Light Bulbs

These are bulbs that can produce white light as well as colors and allow you to control the brightness. They also let you tune the color-temperature of the white light.

There are two kinds of color devices:

1. The most common ones use 14 characters to represent the color (`HEXHSB`).
2. Others use 12 characters for the color (`HSB`).

The `colorFunction` defaults to `HEXHSB` but can be overridden in the config block to use the second type.

It is common for `HEXHSB` devices to use white color temperature and brightness values from 0 to 255 (scale of `255`). It is also common for `HSB` devices to use values from 0 to 1000 (scale of `1000`). If a device doesn't follow these common values, `scaleWhiteColor` and `scaleBrightness` can help.

```json5
{
  name: 'My Colored Bulb',
  type: 'RGBTWLight',
  manufacturer: 'Novostella',
  model: 'Color Changing Floor Light',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for power */
  dpPower: 1,

  /* Override the default datapoint identifier for mode (white vs color) */
  dpMode: 2,

  /* Override the default datapoint identifier for brightness */
  dpBrightness: 3,

  /* Override the default datapoint identifier for color-temperature of the whites */
  dpColorTemperature: 4,

  /* Override the default datapoint identifier for color */
  dpColor: 5,

  /* Minimum white temperature mired value
     (See https://en.wikipedia.org/wiki/Mired) */
  minWhiteColor: 140,

  /* Maximum white temperature mired value */
  maxWhiteColor: 400,

  /* Override the color format (default: HEXHSB)
     Only use if your device is not recognized correctly
     Using HSB defaults the scale of brightness and white color to 1000 */
  colorFunction: 'HEXHSB',

  /* Override the default brightness scale */
  scaleBrightness: 255,

  /* Override the default color temperature scale */
  scaleWhiteColor: 255,
}
```

### Smart Power Strips

These devices can have any number of controllable outlets. To let the plugin know how many your device supports, add an additional parameter named `outletCount`.

```json5
{
  name: 'My Power Strip',
  type: 'MultiOutlet',
  manufacturer: 'GeekBee',
  model: 'Smart Wifi Power Strip',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* This device has 3 outlets and 2 USB ports, all individually controllable */
  outletCount: 5,
}
```

### Non-sequential Power Strips

Some smart power strips don't have sequential data-points. Using `CustomMultiOutlet` you can define the data-points explicitly.

```json5
{
  name: 'My Power Strip',
  type: 'CustomMultiOutlet',
  manufacturer: 'GeekBee',
  model: 'Smart Wifi Power Strip',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Define your data-points here; add more as needed */
  outlets: [
    {
      name: 'Outlet 1',
      dp: 1,
    },
    {
      name: 'Outlet 2',
      dp: 2,
    },
    {
      name: 'USB 1',
      dp: 7,
    },
  ],
}
```

### Air Conditioners

These devices have cooling and/or heating capabilities; they could also have _dry_, _fan_, or other modes but HomeKit's definition doesn't facilitate modes other than _heat_, _cool_, and _auto_.

By default, _heat_ and _cool_ modes are enabled. To disable one, set `noHeat` or `noCool` to `true`.

Tuya devices don't follow a unified pattern for naming the modes — for example, cooling mode is called _COOL_ on Kogan's KAPRA14WFGA and _cold_ on Igenix's IG9901WIFI. By default the plugin uses _COOL_ and _HEAT_; override with `cmdCool` and `cmdHeat` as needed.

```json5
{
  name: 'My Air Conditioner',
  type: 'AirConditioner',
  manufacturer: 'Kogan',
  model: 'KAPRA14WFGA',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* This device has no cooling function */
  noCool: true,

  /* This device has no heating function */
  noHeat: true,

  /* Override cooling phrase */
  cmdCool: 'COOL',

  /* Override heating phrase */
  cmdHeat: 'HEAT',

  /* This device has no oscillation (swinging) function */
  noSwing: true,

  /* Minimum temperature supported, in Celsius (°C) */
  minTemperature: 15,

  /* Maximum temperature supported, in Celsius (°C) */
  maxTemperature: 40,

  /* Temperature change steps, in Celsius (°C) */
  minTemperatureSteps: 1,
}
```

### Heat Convectors

Heating panels with a _low_ or _high_ setting. Since HomeKit doesn't accommodate that directly, it is mapped to `Fan Speed` — be aware that when the fan speed slider is at the lowest value, it turns the device off.

By default the plugin uses _LOW_ and _HIGH_ to request these settings; override with `cmdLow` and `cmdHigh` if your device uses different casing or phrases (e.g., _Low_ and _High_).

If your signature doesn't have a variation of _low_ or _high_, `SimpleHeater` would be the correct device `type` to use instead.

```json5
{
  name: 'My Heat Convector',
  type: 'Convector',
  manufacturer: 'Gorenje',
  model: 'OptiHeat 2000 EWP',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier of activity */
  dpActive: 7,

  /* Override the default datapoint identifier for the desired temperature */
  dpDesiredTemperature: 2,

  /* Override the default datapoint identifier for the current temperature */
  dpCurrentTemperature: 3,

  /* Override the default datapoint identifier for rotation speed */
  dpRotationSpeed: 4,

  /* Override the default datapoint identifier for child-lock */
  dpChildLock: 6,

  /* Override the default datapoint identifier for temperature-display units */
  dpTemperatureDisplayUnits: 19,

  /* Override phrase for low setting */
  cmdLow: 'Low',

  /* Override phrase for high setting */
  cmdHigh: 'High',

  /* This device does not provide locking the physical controls */
  noChildLock: true,

  /* This device has no function to change the temperature units */
  noTemperatureUnit: true,

  /* Minimum temperature supported, in Celsius (°C) */
  minTemperature: 15,

  /* Maximum temperature supported, in Celsius (°C) */
  maxTemperature: 35,
}
```

### Simple Dimmers

Switches that allow turning on/off and dimming.

```json5
{
  name: 'My Simple Dimmer',
  type: 'SimpleDimmer',
  manufacturer: 'TESSAN',
  model: 'Smart Dimmer Switch',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for power */
  dpPower: 1,

  /* Override the default datapoint identifier for brightness */
  dpBrightness: 2,

  /* Override the default brightness scale. Common values are 255 or 1000 */
  scaleBrightness: 1000,
}
```

### Simple Heaters

While defined mainly to develop a more robust device type, this can be used to control a heating device by only setting a desired temperature.

```json5
{
  name: 'My Simple Heater',
  type: 'SimpleHeater',
  manufacturer: 'Branded',
  model: 'Simple',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for being active */
  dpActive: 1,

  /* Override the default datapoint identifier for the desired temperature */
  dpDesiredTemperature: 2,

  /* Override the default datapoint identifier for the current temperature */
  dpCurrentTemperature: 3,

  /* If your device reports temperatures in multiples of the real value, define it here.
     e.g., if your device reports 155 for 15.5°C, use the value 10 */
  temperatureDivisor: 1,

  /* Minimum temperature supported, in Celsius (°C) */
  minTemperature: 15,

  /* Maximum temperature supported, in Celsius (°C) */
  maxTemperature: 35,
}
```

### Garage Doors

::: warning Early Testing
If your garage door or garage door opener does more than just open and close (e.g., reports its position or detects obstacles), please [create an issue](https://github.com/nubisco/homebridge-tuya-local-platform/issues/new) and paste your signature with any information you can provide.
:::

```json5
{
  name: 'My Garage Door',
  type: 'GarageDoor',
  manufacturer: 'eWeLink',
  model: 'WiFi Switch Garage Door Controller',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for triggering the opener */
  dpAction: 1,

  /* Override the default datapoint identifier for the state of the door */
  dpStatus: 2,

  /* If the app reports open when the door is closed,
     and reports closed when it is open */
  flipState: true,
}
```

### Simple Blinds

Normally blinds don't report their position. This plugin attempts to time the movements to estimate the positions. You can adjust a few parameters to make it accurate for your setup.

```json5
{
  name: 'My Simple Blinds',
  type: 'SimpleBlinds',
  manufacturer: 'TeePao',
  model: 'Roller Switch',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Additional parameters to override defaults only if needed */

  /* How many seconds does it take to fully open from a fully closed state */
  timeToOpen: 45,

  /* How many seconds it spends tightening the blinds while closing */
  timeToTighten: 0,

  /* If the app reports open when the blinds are closed,
     and reports closed when they are open */
  flipState: true,
}
```

### Outlets with White and Color Lights

These are plugs with a single outlet that have controllable white and colored LEDs on them.

There are two kinds of color devices:

1. The most common ones use 14 characters to represent the color (`HEXHSB`).
2. Others use 12 characters for the color (`HSB`).

The `colorFunction` defaults to `HEXHSB` but can be overridden in the config block to use the second type.

It is common for `HEXHSB` devices to use white color temperature and brightness values from 0 to 255 (scale of `255`). It is also common for `HSB` devices to use values from 0 to 1000 (scale of `1000`). If a device doesn't follow these common values, `scaleWhiteColor` and `scaleBrightness` can help.

```json5
{
  name: 'My Colored Outlet',
  type: 'RGBTWOutlet',
  manufacturer: 'EZH',
  model: 'Wifi Colored Smart Life Outlet',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* If your device provides energy parameters, define these */

  /* Datapoint identifier for voltage reporting */
  voltsId: 9,

  /* Datapoint identifier for amperage reporting */
  ampsId: 8,

  /* Datapoint identifier for wattage reporting */
  wattsId: 7,

  /* Often voltage is reported divided by 10; if that is
     not the case for you, override the default */
  voltsDivisor: 10,

  /* Often amperage is reported divided by 1000; if that is
     not the case for you, override the default */
  ampsDivisor: 1000,

  /* Often wattage is reported divided by 10; if that is
     not the case for you, override the default */
  wattsDivisor: 10,

  /* Additional parameters to override defaults only if needed */

  /* Override the default datapoint identifier for outlet power */
  dpPower: 101,

  /* Override the default datapoint identifier for light power */
  dpLight: 1,

  /* Override the default datapoint identifier for mode (white vs color) */
  dpMode: 2,

  /* Override the default datapoint identifier for brightness */
  dpBrightness: 3,

  /* Override the default datapoint identifier for color-temperature of the whites */
  dpColorTemperature: 4,

  /* Override the default datapoint identifier for color */
  dpColor: 5,

  /* Minimum white temperature mired value
     (See https://en.wikipedia.org/wiki/Mired) */
  minWhiteColor: 140,

  /* Maximum white temperature mired value */
  maxWhiteColor: 400,

  /* Override the color format (default: HEXHSB)
     Only use if your device is not recognized correctly
     Using HSB defaults the scale of brightness and white color to 1000 */
  colorFunction: 'HEXHSB',

  /* Override the default brightness scale */
  scaleBrightness: 255,

  /* Override the default color temperature scale */
  scaleWhiteColor: 255,
}
```

### Smart Fan Regulators

These are accessories that act as a regulator switch or an inbuilt regulator for your ceiling fan. Most common options are an on/off switch and speed controls generally controlled through two buttons — one speed at a time in each direction.

There are two kinds of regulator devices:

1. The most common ones use 3 speed controls.
2. Others use 5 speed controls, found compatible with most fan regulators in India, Australia, and the UK.

```json5
{
  name: 'My Fan',
  type: 'Fan',
  manufacturer: 'HomeMate',
  model: 'HomeMate 5-Speed Smart Touch-Controlled Fan Regulator',
  id: '032000123456789abcde',
  key: '0123456789abcdef',

  /* Override the default datapoint identifier of activity */
  dpActive: '1',

  /* Override the default datapoint identifier of rotation speed */
  dpRotationSpeed: '2',
}
```

### Smart Fan with Light

These are fan devices with controllable speeds, direction, and a built-in light. There are multiple kinds of devices with different speed and light controls.

```json5
{
  type: 'FanLight',
  name: 'My Fan with Light',
  id: '032000123456789abcde',
  key: '0123456789abcdef',
  manufacturer: 'Hunter Pacific International',
  model: 'Polar v2 Fan',

  dpLight: 20,
  useBrightness: true,
  dpBrightness: 22,
  minBrightness: 1,
  scaleBrightness: 9,

  dpActive: 60,
  dpRotationSpeed: 62,
  maxSpeed: 9,
  dpRotationDirection: 63,
}
```
