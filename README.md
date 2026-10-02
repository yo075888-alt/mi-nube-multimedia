# Mi Nube Multimedia

Aplicación de almacenamiento multimedia con Next.js, Supabase y Vercel.

## Incluye
- Registro e inicio de sesión con Supabase Auth.
- Panel responsive tipo nube.
- Subida múltiple por selector o arrastrar y soltar.
- Metadatos de archivos en `public.files`.
- Carpetas, favoritos y papelera.
- Bucket privado `media`.

## Variables de entorno
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Ejecución local
```bash
npm install
cp .env.example .env.local
npm run dev
```

La base de datos de este proyecto ya está preparada en el proyecto Supabase asociado. No uses una service role key en el navegador.
