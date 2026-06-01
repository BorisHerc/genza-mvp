export type Locale = 'hr' | 'en'

export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary
}

export type TranslationParams = Record<string, string | number>
