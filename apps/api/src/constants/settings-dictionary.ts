export const SETTINGS_DICTIONARY_NAME_MAX_LENGTH = 100;
export const SETTINGS_DICTIONARY_NAME_PATTERN = /^[A-Z][A-Za-z ]*$/;

//===============================================================

export function normalizeSettingsDictionaryName(value: string): string {
  return value.trim();
}

//===============================================================

export function normalizeSettingsDictionaryNameKey(value: string): string {
  return normalizeSettingsDictionaryName(value)
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
