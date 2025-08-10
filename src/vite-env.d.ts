/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL: string
  readonly VITE_ANON: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}