export type ImageSource = 'user' | 'master_database' | 'open_food_facts' | 'placeholder'

export const IMAGE_SOURCE_LABELS: Record<ImageSource, string> = {
  user: 'Your photo',
  master_database: 'Master database',
  open_food_facts: 'Open Food Facts',
  placeholder: 'Placeholder',
}
