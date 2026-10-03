# Mi Nube Multimedia

Aplicación Next.js + Supabase para guardar fotos, videos y archivos de forma privada.

## Funciones
- Registro e inicio de sesión con Supabase Auth.
- Panel responsive.
- Subida múltiple por selector y arrastrar/soltar.
- Carpetas.
- Favoritos.
- Papelera y eliminación definitiva.
- Descarga mediante URL firmada.
- Bucket privado `media`.

## Variables
`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Instalación
```bash
npm install
cp .env.example .env.local
npm run dev
```
