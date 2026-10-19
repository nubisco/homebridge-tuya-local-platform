# Matter

Homebridge 2 can expose accessories over Matter as well as HomeKit. With Matter, a Tuya
device configured here can also be added to Google Home, Amazon Alexa, SmartThings and other
Matter controllers, still controlled locally over your LAN.

Matter is opt-in, per device. A device that asks for it keeps its HomeKit accessory exactly as
before, rooms and automations included. It is exposed over Matter **as well**, through the same
LAN connection.

## Requirements

- Homebridge 2 with Matter turned on for the bridge (or child bridge) that runs this plugin.
  In the Homebridge UI this is in the bridge settings. In `config.json` it is a `matter` block
  under `bridge`, for example `"matter": { "port": 5540 }`.
- The bridge's Matter pairing code, which Homebridge shows once Matter is on. Pair it in your
  Matter controller, the same way you pair any Matter bridge.

On Homebridge 1.x, or with Matter turned off, the setting is ignored: the plugin logs one
warning and the devices stay HomeKit-only.

## Turning it on for a device

Set `matter` to `true` on the device, or tick **Expose over Matter** in the plugin settings:

```json
{
  "type": "RGBTWLight",
  "name": "Desk Lamp",
  "id": "xxxxxxxxxxxxxxxxxxxx",
  "key": "xxxxxxxxxxxxxxxx",
  "matter": true
}
```

Restart Homebridge. The device appears in your Matter controller under the bridge you paired.
Clearing the flag and restarting removes it from Matter again, and leaves HomeKit untouched.

::: warning Apple Home
If you pair the Homebridge Matter bridge with Apple Home as well, a device with `matter`
turned on shows up twice there: once from HomeKit and once from Matter. Pair the Matter bridge
with your other controllers only, or leave `matter` off for the devices Apple Home already has.
:::

## Supported device types

| Type key                           | Exposed over Matter as                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `SimpleLight`                      | On/off light                                                                      |
| `SimpleDimmer`, `SimpleDimmer2`    | Dimmable light                                                                    |
| `TWLight`                          | Colour temperature light                                                          |
| `RGBTWLight`                       | Extended colour light (hue and saturation, xy colour, colour temperature)         |
| `Outlet`                           | On/off plug-in unit                                                               |
| `MultiOutlet`, `CustomMultiOutlet` | One device with an on/off plug-in unit per outlet                                 |
| `Switch`                           | On/off switch, or one device with a switch per gang when `switchCount` is above 1 |

Every other type stays HomeKit-only for now, and the plugin logs a warning if `matter` is set
on one. Fans, blinds, valves and climate devices are next. Air purifiers, dehumidifiers and oil
diffusers have no matching Matter device type yet.

The same DataPoint overrides apply over Matter as in HomeKit (`dpPower`, `dpBrightness`,
`minBrightness`, `scaleBrightness`, `dpColorTemperature`, `dpMode`, `dpColor`, `cmdWhite`,
`cmdColor`, and so on).

## What to expect

- **Colour temperature** uses the bulb's own white range, from `minWhiteColor` (coolest) to
  `maxWhiteColor` (warmest), in mireds. The defaults are 140 and 400. Set them if your
  controller's warm and cool ends do not line up with the bulb.
- **Hold-to-dim** (a continuous dimming ramp) is refused. Tuya devices do not follow a
  transition over LAN, so the bridge says so instead of showing a level the bulb never reached.
  Setting a level, and stepping it up or down, both work.
- **Energy readings** on outlets are HomeKit-only for now.
- **An offline device** answers Matter commands with a "busy" error, so the controller shows the
  command failed instead of pretending it worked.
