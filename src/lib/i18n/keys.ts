/**
 * Catalogue keys introduced by Story 24.1 (admin switcher block only).
 * Story 24.2 adds the sweep keys.
 */
export const I18N_KEYS = [
  'admin.uiLocale.title',
  'admin.uiLocale.description',
  'admin.uiLocale.label',
  'admin.uiLocale.option.en',
  'admin.uiLocale.option.id',
  'admin.uiLocale.save',
  'admin.uiLocale.saving',
  'admin.uiLocale.saved.en',
  'admin.uiLocale.saved.id',
  'admin.uiLocale.saveFailed',
] as const;

export type I18nKey = (typeof I18N_KEYS)[number];
