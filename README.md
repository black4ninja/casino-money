# Casino Money

Monedero virtual con fichas criptográficamente firmadas para dinámicas de casino en el aula. App 100% estática, sin backend, desplegable en GitHub Pages.

## Cómo funciona

1. **El maestro** crea una sesión en `/admin`: define un nombre y una contraseña maestra. Se deriva un par de llaves Ed25519 vía PBKDF2 (210 000 iteraciones). Se genera un **QR de sesión** con `sessionId`, `dealerPubKey` y `salt` — este QR es público y lo comparten con todos.
2. **Los talladores** escanean el QR de sesión y entran en `/dealer`. Con la contraseña maestra y un nombre de mesa ("Mesa-1"), cada dispositivo deriva la misma clave privada en memoria (nunca se guarda). La app verifica que la derivación produce la `dealerPubKey` correcta antes de permitir emitir.
3. **Los jugadores** escanean el QR de sesión en `/player`, crean un alias y la app les genera un par de llaves local para endosar fichas.
4. **Flujo de una apuesta**:
   - Jugador muestra su QR de identidad → tallador lo escanea → elige denominaciones ($10, $50, $100, $500, $1000) → la app del tallador firma cada ficha y muestra un QR con todas las fichas → jugador lo escanea y suma a su cartera.
   - Para pagar en la mesa: jugador selecciona fichas (solo de la mesa emisora) → muestra QR de pago → tallador escanea, verifica firmas, marca seriales como gastados en su ledger local, emite QR de recibo → jugador escanea recibo y sus fichas quedan marcadas como gastadas.
5. **Transferencias jugador↔jugador**: cada ficha acumula una cadena de endosos firmados por cada jugador que la posee. El último "to" es el dueño actual. Al cobrar, el tallador verifica la cadena completa.

## Seguridad

- **No falsificable**: sin la contraseña maestra, nadie puede producir fichas con firma válida.
- **No duplicable en una misma mesa**: cada tallador mantiene una lista de seriales ya cobrados en `localStorage`.
- **Fichas atadas al dealer emisor**: previene el double-spend entre mesas sin requerir sincronización en tiempo real. Para apostar en la Mesa-N, el jugador necesita fichas emitidas por la Mesa-N (o transferidas entre jugadores pero con `dealerId` de la mesa donde cobrarán).
- **Inmune a tampering del localStorage**: el balance no se guarda como número sino como lista de fichas verificables. Cualquier modificación rompe la firma.
- **Sin datos sensibles persistidos del lado del tallador**: la clave privada solo vive en memoria mientras la pestaña está abierta.

### Riesgos residuales aceptados

- Double-spend P2P (jugador paga la misma ficha a dos amigos) — solo el primero en cobrar con el tallador emisor gana. Es equivalente a un billete falso entre particulares.
- Pérdida de wallet por borrar caché del navegador — igual que perder billetes físicos.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 32+ tests (crypto, domain, QR)
npm run typecheck
npm run build      # bundle estático en dist/
```

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy.yml` publica automáticamente la rama `main` en Pages. Habilita Pages en Settings → Pages → Source: **GitHub Actions**. El `VITE_BASE` se calcula a partir del nombre del repo.

## Stack

- React 18 + TypeScript + Vite + HashRouter
- Tailwind v4 con tema casino custom
- `@noble/ed25519` + `@noble/hashes` (firmas + PBKDF2)
- `qrcode` + `@zxing/browser` (QR encode/decode + cámara)
- Zustand para estado + `localStorage` versionado

## Estructura

```
src/
├── crypto/        # Ed25519 + PBKDF2 + canonical JSON
├── domain/        # Chip, Endorsement, verificación pura
├── storage/       # localStorage con esquema versionado
├── qr/            # schemas + codec
├── stores/        # Zustand stores por rol
├── components/    # atoms, molecules, templates (atomic design)
└── pages/         # Landing, player/, dealer/, admin/
```
