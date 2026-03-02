# Configuración de Variables de Entorno en Railway

Configura estas variables en Railway → tu proyecto → Variables:

| Variable | Descripción |
|---|---|
| `FIREFLY_API_TOKEN` | Token de API de Firefly III |
| `FIREFLY_BASE_URL` | URL de tu instancia de Firefly III |
| `GOOGLE_SHEETS_ID` | ID de tu hoja de Google Sheets |
| `ICLOUD_EMAIL` | Email de iCloud |
| `ICLOUD_APP_PASSWORD` | Contraseña de aplicación de iCloud |
| `JWT_SECRET` | String aleatorio largo para firmar cookies |
| `NODE_ENV` | `production` |

## Endpoint para atajo de iPhone

Una vez desplegado, el atajo de iPhone debe apuntar a:

```
POST https://tu-proyecto.up.railway.app/registrar-gasto
Body: { "texto": "25 euros mercadona" }
```
