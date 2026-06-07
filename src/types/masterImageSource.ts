/** How a master can reference/catalog image was obtained. */
export type MasterImageSource =
  | 'official_site'
  | 'manual'
  | 'seed'
  | 'open_food_facts'
  | 'placeholder'

export const MASTER_IMAGE_SOURCE_LABELS: Record<MasterImageSource, string> = {
  official_site: 'Official site reference',
  manual: 'Manual admin entry',
  seed: 'Seed data',
  open_food_facts: 'Open Food Facts',
  placeholder: 'Placeholder',
}
