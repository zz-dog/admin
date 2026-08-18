/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 地址,见 .env.example */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
