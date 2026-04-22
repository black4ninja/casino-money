# HTTP Interfaces

Capa de presentación (MVC-C) sobre la arquitectura limpia del resto del backend.

```
request → express router → controller → application/use-case → domain/entity
                                                    ↓
                                      infrastructure (Parse/Mongo)
```

## Reglas

- Los **controllers** son delgados: leen el request, invocan un caso de uso, formatean la respuesta. Nunca contienen lógica de negocio.
- Los **routes** sólo declaran el montaje HTTP + qué controller atiende.
- Los **middlewares** manejan preocupaciones transversales (errores, auth, logging).
- Ninguna de estas carpetas puede importar de otra `interfaces/*`: sólo hacia `application/` y `domain/`.
