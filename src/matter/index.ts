import LightMatterAccessory from './Light.matter'
import OnOffMatterAccessory from './OnOff.matter'
import type MatterBaseAccessory from './MatterBase.accessory'

export { default as MatterBaseAccessory } from './MatterBase.accessory'
export { default as OnOffMatterAccessory } from './OnOff.matter'
export { default as LightMatterAccessory } from './Light.matter'

/**
 * Device types that can also be exposed over Matter, keyed like CLASS_DEF. A type
 * missing here stays HomeKit-only, with a warning when its config asks for Matter.
 */
export const MATTER_CLASS_DEF: Record<string, new (...args: any[]) => MatterBaseAccessory> = {
  simplelight: OnOffMatterAccessory,
  outlet: OnOffMatterAccessory,
  multioutlet: OnOffMatterAccessory,
  custommultioutlet: OnOffMatterAccessory,
  switch: OnOffMatterAccessory,
  simpledimmer: LightMatterAccessory,
  simpledimmer2: LightMatterAccessory,
  twlight: LightMatterAccessory,
  rgbtwlight: LightMatterAccessory,
}
