---
tags: [integraciones, supabase, google-maps, whatsapp, externo]
created: 2026-07-24
updated: 2026-07-24
---

# Integraciones Externas — DinoPay

[[INDEX|← Volver al Index]]

---

## Supabase

### Qué provee
- **PostgreSQL**: Base de datos relacional principal
- **Auth**: Sistema de autenticación (login, sesiones, tokens)
- **RLS**: Row Level Security para aislamiento de datos
- **Realtime**: Suscripciones en tiempo real
- **Storage**: Almacenamiento de archivos (no usado aún, pero disponible)

### Configuración Necesaria

**Variables de entorno**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[proyecto-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Clave pública (safe para el browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Solo en servidor, NUNCA en browser
```

### Paquetes NPM
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Archivos de Configuración
```
src/lib/supabase/
├── client.ts      # createBrowserClient — para componentes del browser
├── server.ts      # createServerClient — para Server Components y Actions
└── types.ts       # Tipos generados con: npx supabase gen types typescript
```

### Generar Tipos TypeScript desde el Schema
```bash
npx supabase gen types typescript --project-id [proyecto-id] > src/lib/supabase/types.ts
```

### Límites del Plan Free de Supabase
| Recurso | Límite Free |
|---------|-------------|
| Database | 500 MB |
| Auth users | 50,000 |
| Storage | 1 GB |
| Bandwidth | 5 GB/mes |
| Realtime connections | 200 simultáneas |

### Errores Comunes en Supabase
- **"JWT expired"**: El token de sesión venció. Se maneja automáticamente con `@supabase/ssr`.
- **"Row violates RLS policy"**: El usuario no tiene permisos para esa operación. Revisar policies.
- **"unique constraint violated"**: Violación de unique index. Ej: cliente con préstamo activo ya existente.

---

## Google Maps API

### Para qué se usa
1. **Selección de ubicación del cliente**: Al crear/editar cliente, el usuario arrastra un pin en el mapa para guardar lat/lng
2. **Abrir Maps desde tarjeta**: Al presionar el ícono de ubicación en una tarjeta de préstamo, abre Google Maps en la ubicación del cliente

### Configuración

**Variables de entorno**:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

> ⚠️ Restringir la API Key en Google Cloud Console:
> - Solo permitir HTTP referrers del dominio de la app
> - Solo habilitar las APIs necesarias: Maps JavaScript API

**APIs requeridas** (en Google Cloud Console):
- Maps JavaScript API
- (Opcionalmente) Places API si se quiere búsqueda de direcciones

### Paquetes NPM
```bash
npm install @vis.gl/react-google-maps
```

### Uso en el Código
```typescript
// Componente MapaPicker
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'

// Abrir Maps desde tarjeta
const openMaps = (lat: number, lng: number) => {
  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank')
}
```

### Límites del Plan Gratuito
- $200/mes de crédito gratuito de Google
- Map loads: ~28,000/mes gratis
- Para esta app el uso debería mantenerse dentro del free tier

### Errores Comunes
- **"This page can't load Google Maps correctly"**: API Key inválida o sin el dominio en la allowlist
- **"You have exceeded your request quota"**: Superar el crédito gratuito

---

## WhatsApp (Web API)

### Cómo se usa
No hay integración con la API oficial de WhatsApp Business. Se usa el esquema URL de WhatsApp Web:

```typescript
const openWhatsApp = (phone: string, message?: string) => {
  const clean = phone.replace(/\D/g, '') // Quitar caracteres no numéricos
  const url = message 
    ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${clean}`
  window.open(url, '_blank')
}
```

### Limitaciones
- Requiere que el cobrador tenga WhatsApp instalado en su dispositivo
- No se pueden enviar mensajes automáticos sin la API oficial
- Si el número no tiene WhatsApp, mostrará un error de WhatsApp

---

## Integraciones Futuras (Ideas)

| Integración | Uso potencial | Estado |
|-------------|---------------|--------|
| WhatsApp Business API | Mensajes automáticos de recordatorio de pago | Idea |
| Pusher | Alternativa a Supabase Realtime si escala mucho | Idea |
| Resend | Emails de reportes al admin | Idea |
| Vercel Analytics | Analytics de uso de la app | Pendiente |

---

## Ver También
- [[arquitectura/AUTENTICACION]] — Cómo funciona el auth de Supabase
- [[arquitectura/BASE-DE-DATOS]] — Schema de la DB de Supabase
- [[seguridad/SEGURIDAD]] — Seguridad de las claves API
