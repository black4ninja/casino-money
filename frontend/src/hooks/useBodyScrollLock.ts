import { useEffect } from "react";

/**
 * Bloquea el scroll del `<body>` mientras este hook está activo. Usar en
 * modales/overlays para que hacer swipe o rueda no scrollee la página detrás
 * (distrae y delata la posición de la vista padre).
 *
 * Guarda y restaura el overflow previo del body — no asume que era "auto",
 * lo que permite anidar o coexistir con cualquier estilo base del proyecto.
 *
 * iOS quirk: en Safari móvil, `overflow: hidden` solo no siempre bloquea el
 * scroll del body al hacer swipe. Fijamos `position: fixed` + preservamos el
 * scroll previo para restaurarlo al cerrar — técnica estándar de lock en iOS.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;
    const scrollY = window.scrollY;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
