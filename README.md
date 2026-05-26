# 🤖 AutomateHub MCP Server

> Servidor **Model Context Protocol (MCP)** que conecta agentes de IA directamente con la API de GitHub. Permite crear repositorios, ramas, commits multi-archivo, issues, pull requests y más, todo desde instrucciones en lenguaje natural.

---

## 📋 Tabla de Contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [¿Por qué es útil?](#-por-qué-es-útil-casos-de-uso)
- [Requisitos del sistema](#-requisitos-del-sistema)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Documentación de Tools](#-documentación-de-tools)
- [Ejemplos de uso](#-ejemplos-de-uso)
- [Diagrama de arquitectura](#-diagrama-de-arquitectura)
- [Tests](#-tests)
- [Troubleshooting](#-troubleshooting)
- [Licencia](#-licencia)

---

## 🚀 ¿Qué es este proyecto?

AutomateHub es un **servidor MCP (Model Context Protocol)** construido con TypeScript que actúa como puente entre un modelo de lenguaje (LLM) y la API de GitHub.

El protocolo MCP, creado por Anthropic, es un estándar abierto que permite a los LLMs conectarse a herramientas y servicios externos de forma segura y estructurada. Este servidor implementa dicho protocolo para exponer **9 tools** que le permiten a cualquier agente de IA realizar operaciones reales en GitHub usando instrucciones en lenguaje natural.

```
Usuario ──► LLM (Claude, GPT, etc.) ──► AutomateHub MCP Server ──► API de GitHub
```

---

## 💡 ¿Por qué es útil? (Casos de uso)

| Escenario | Sin AutomateHub | Con AutomateHub |
|---|---|---|
| Subir código nuevo | Git add, commit, push manual | *"Sube estos 5 archivos al repo con el mensaje 'feat: nueva funcionalidad'"* |
| Abrir un bug | Ir a GitHub, navegar, llenar formulario | *"Abrí un issue con el título 'Error en login' y descripción detallada"* |
| Crear un feature branch | `git checkout -b feature/nueva` | *"Crea la rama feature/auth a partir de main"* |
| Code review | Abrir PR manualmente | *"Abre un pull request de feature/auth hacia main"* |
| Onboarding | Invitar colaborador desde la UI | *"Agrega a juan123 como colaborador con permisos de escritura"* |
| Auditoría | Descargar y abrir archivos | *"Leeme el contenido del archivo src/config.ts del repositorio mi-proyecto"* |

---

## 🖥️ Requisitos del sistema

| Requisito | Versión mínima | Recomendada |
|---|---|---|
| **Node.js** | v18.0.0 | v20.x LTS |
| **npm** | v8.0.0 | v10.x |
| **TypeScript** | v5.0.0 | v5.3.x |
| **Sistema operativo** | Windows 10, macOS 12, Ubuntu 20.04 | Linux / macOS |
| **Cuenta de GitHub** | Cualquier plan | — |

Verificá tu versión de Node.js con:
```bash
node --version
```

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Taimolrvz007/ProyectoM5_JosueKalethSalazar.git
cd ProyectoM5_JosueKalethSalazar
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Compilar TypeScript

```bash
npm run build
```

Esto genera la carpeta `dist/` con el JavaScript listo para ejecutar.

> **Nota:** Para desarrollar con recarga automática al guardar cambios, usá `npm run dev` en vez de `npm run build`.

### 4. Verificar la instalación

```bash
npm start
```

Si ves el mensaje `AutomateHub MCP Server corriendo exitosamente via stdio.` en los logs, la instalación fue exitosa.

---

## ⚙️ Configuración

### 1. Obtener un GitHub Personal Access Token (PAT)

1. Ingresá a tu cuenta de GitHub
2. Hacé clic en tu foto de perfil → **Settings**
3. En el menú izquierdo, bajá hasta **Developer settings**
4. Seleccioná **Personal access tokens** → **Tokens (classic)**
5. Clic en **Generate new token (classic)**
6. Poné un nombre descriptivo (ej: `automatehub-mcp`)
7. Seleccioná la expiración deseada
8. Marcá los **scopes** necesarios (ver siguiente sección)
9. Clic en **Generate token** y copiá el token generado ⚠️ (solo se muestra una vez)

### 2. Scopes necesarios para el token

| Scope | ¿Para qué se usa? |
|---|---|
| `repo` | Leer y escribir repositorios privados y públicos (commits, ramas, archivos) |
| `public_repo` | (Alternativa a `repo` si solo usás repos públicos) |
| `user` | Leer datos del usuario autenticado |
| `admin:org` | Agregar colaboradores a repositorios de organizaciones |

> **Mínimo recomendado:** `repo` + `user`

### 3. Configurar el archivo `.env`

Creá un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editá el archivo `.env` con tu token:

```env
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_tu_token_aqui_1234567890abcdef
```

> ⚠️ **Nunca subas el archivo `.env` a GitHub.** Está incluido en el `.gitignore` por defecto.

### 4. Configurar el servidor MCP en Antigravity / Clientes MCP

Editá el archivo de configuración de tu cliente MCP (ej. `mcp_config.json`).

> 💡 **Seguridad Mejorada:** Gracias al sistema de resolución dinámica absoluta del servidor, este localiza automáticamente tu archivo `.env` en la raíz del proyecto. **No necesitás exponer ni hardcodear tu `GITHUB_TOKEN` en este archivo de configuración.** El token se leerá de manera completamente segura desde tu `.env` local.

#### Opción A: Ejecutar directamente con `tsx` (Código de desarrollo)

Si preferís correr directamente el archivo TypeScript sin pasar por compilaciones:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/ruta/absoluta/al/proyecto/src/server.ts"
      ]
    }
  }
}
```

> Reemplazá `/ruta/absoluta/al/proyecto/` con la ruta real en tu sistema.  
> Ejemplo Windows: `D:\Janus\Documents\ProyectoM5_JosueSalazar\src\server.ts`

#### Opción B: Ejecutar el JavaScript compilado (Recomendado para producción)

Si preferís correr el código compilado en la carpeta `dist/` tras hacer `npm run build`:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": [
        "/ruta/absoluta/al/proyecto/dist/server.js"
      ]
    }
  }
}
```

#### Inspeccionar las tools con MCP Inspector

Para visualizar y probar las tools antes de conectarlas a un LLM:

```bash
npx @modelcontextprotocol/inspector node --env-file=.env dist/server.js
```

Luego abrí `http://localhost:6274` en tu navegador, hacé clic en **Connect** y explorá las tools disponibles.

---

## 🛠️ Documentación de Tools

### 1. `list_repositories`

**Descripción:** Lista los repositorios personales del usuario autenticado. Incluye paginación y caché en memoria para no consumir cuota de API innecesariamente.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `per_page` | `number` | No | Resultados por página (1-100). Por defecto: 30 |
| `page` | `number` | No | Número de página (mínimo 1). Por defecto: 1 |

**Ejemplo de prompt:**
> *"Listame todos mis repositorios de GitHub"*  
> *"Mostrame la segunda página de mis repos, de a 10 por página"*

---

### 2. `create_repository`

**Descripción:** Crea un nuevo repositorio en la cuenta del usuario autenticado.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | `string` | ✅ Sí | Nombre único del repositorio (3-100 chars, sin espacios) |
| `description` | `string` | No | Descripción breve del proyecto |
| `private` | `boolean` | No | Si el repo será privado. Por defecto: `false` |

**Ejemplo de prompt:**
> *"Creame un repositorio público llamado 'mi-portfolio' con la descripción 'Mi portfolio personal'"*  
> *"Crea un repo privado llamado 'notas-secretas'"*

---

### 3. `create_commit`

**Descripción:** Sube o edita uno o varios archivos de forma simultánea en un único **commit atómico**. Soporta repositorios vacíos (los inicializa automáticamente).

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Dueño del repositorio |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `message` | `string` | ✅ Sí | Mensaje del commit |
| `branch` | `string` | No | Rama destino. Por defecto: `main` |
| `files` | `array` | ✅ Sí | Lista de archivos a subir (ver formato abajo) |

**Formato del parámetro `files`:**

```json
[{"path": "README.md", "content": "# Mi Proyecto"}]

[
  {"path": "src/app.js", "content": "console.log('Hola mundo');"},
  {"path": "src/utils.js", "content": "export const suma = (a, b) => a + b;"},
  {"path": "package.json", "content": "{\"name\": \"mi-app\"}"}
]
```

**Ejemplo de prompt:**
> *"Subí un archivo README.md con el contenido '# Hola Mundo' al repositorio 'mi-proyecto'"*  
> *"Hacé un commit en la rama develop del repo 'mi-app' con estos 3 archivos"*

---

### 4. `get_file_content`

**Descripción:** Lee el contenido de un archivo específico desde un repositorio remoto de GitHub, decodificando automáticamente el Base64.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Propietario del repositorio |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `path` | `string` | ✅ Sí | Ruta completa del archivo (ej: `src/index.js`) |
| `branch` | `string` | No | Rama de la cual leer. Por defecto: rama principal |

**Ejemplo de prompt:**
> *"Leeme el archivo src/config.ts del repositorio mi-api"*  
> *"Mostrame el contenido del README.md de la rama develop"*

---

### 5. `create_branch`

**Descripción:** Crea una nueva rama de desarrollo a partir de otra existente.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Dueño del repositorio |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `branch_name` | `string` | ✅ Sí | Nombre de la rama a crear (ej: `feature/login`) |
| `from_branch` | `string` | No | Rama origen. Por defecto: `main` |

**Ejemplo de prompt:**
> *"Creá la rama 'feature/autenticacion' a partir de main en el repo 'mi-api'"*  
> *"Crea una rama 'hotfix/bug-critico' desde la rama 'develop'"*

---

### 6. `create_issue`

**Descripción:** Abre un nuevo issue (tarea, bug, feature request) dentro de un repositorio.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Usuario o nombre de la organización |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `title` | `string` | ✅ Sí | Título descriptivo del problema |
| `body` | `string` | No | Detalles del issue en Markdown |

**Ejemplo de prompt:**
> *"Abrí un issue en 'mi-api' con el título 'Error 500 en endpoint /users'"*  
> *"Creá una tarea en el repo 'mi-proyecto' para implementar autenticación con JWT"*

---

### 7. `list_issues`

**Descripción:** Lista los issues de un repositorio, con filtro por estado.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Dueño del repositorio |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `state` | `"open"` \| `"closed"` \| `"all"` | No | Filtro de estado. Por defecto: `"open"` |

**Ejemplo de prompt:**
> *"Mostrame todos los issues abiertos del repo 'mi-proyecto'"*  
> *"Listame los issues cerrados del repositorio 'mi-api'"*

---

### 8. `create_pull_request`

**Descripción:** Abre una propuesta de cambio (Pull Request) para fusionar el código de una rama hacia otra.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Dueño del repositorio |
| `repo` | `string` | ✅ Sí | Nombre del repositorio |
| `title` | `string` | ✅ Sí | Título del Pull Request |
| `head` | `string` | ✅ Sí | Rama con los cambios (ej: `feature/login`) |
| `base` | `string` | No | Rama destino. Por defecto: `main` |
| `body` | `string` | No | Descripción de los cambios para los revisores |

**Ejemplo de prompt:**
> *"Abrí un PR del repo 'mi-api' para fusionar la rama 'feature/autenticacion' hacia main"*

---

### 9. `add_collaborator`

**Descripción:** Agrega a otro usuario de GitHub como colaborador de un repositorio, con permisos a elección.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ Sí | Dueño del repositorio |
| `repo` | `string` | ✅ Sí | Nombre exacto del repositorio |
| `username` | `string` | ✅ Sí | Nombre exacto del usuario en GitHub |
| `permission` | `"pull"` \| `"push"` \| `"admin"` | No | Rol asignado. Por defecto: `"push"` |

**Ejemplo de prompt:**
> *"Invitá al usuario 'devjuan123' como colaborador con permisos de escritura en el repo 'mi-proyecto'"*  
> *"Agrega a 'maria-github' como admin del repositorio 'empresa-repo'"*

---

## 🎯 Ejemplos de uso

### Flujo completo: Crear un proyecto desde cero

```
1. "Creame un repositorio público llamado 'e-commerce-api' con la descripción 'API REST para tienda online'"

2. "Subí estos archivos al repo 'e-commerce-api' con el mensaje 'feat: estructura inicial del proyecto':
   - src/index.js
   - src/routes/products.js
   - README.md"

3. "Creá la rama 'feature/autenticacion' en 'e-commerce-api'"

4. "Subí el archivo src/auth/jwt.js al repo 'e-commerce-api' en la rama 'feature/autenticacion'"

5. "Abrí un PR de 'feature/autenticacion' hacia main en 'e-commerce-api' con título 'feat: sistema de autenticación JWT'"

6. "Invitá a 'mi-compañero-github' como colaborador con permisos de escritura en 'e-commerce-api'"
```

### Flujo de debugging con issues

```
1. "Listame los issues abiertos del repo 'e-commerce-api'"

2. "Abrí un issue en 'e-commerce-api' con el título 'Error 401 en ruta /api/products' y el body:
   ## Descripción
   La ruta devuelve 401 sin token cuando debería ser pública.
   ## Pasos para reproducir
   1. GET /api/products sin header Authorization
   ## Comportamiento esperado
   Devolver lista de productos"

3. "Leeme el archivo src/routes/products.js del repo 'e-commerce-api'"
```

---

## 🏗️ Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente MCP (LLM)                       │
│          (Claude, GPT, Antigravity, MCP Inspector)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Model Context Protocol (stdio)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AutomateHub MCP Server                     │
│                     src/server.ts                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Tool Registry (9 tools)               │   │
│  │  list_repositories  │  create_repository            │   │
│  │  create_commit      │  get_file_content             │   │
│  │  create_branch      │  create_issue                 │   │
│  │  list_issues        │  create_pull_request          │   │
│  │                     │  add_collaborator             │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │              Capa de Validación (Zod)                │   │
│  │                 src/schemas/index.ts                 │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │           Capa de Operaciones GitHub                 │   │
│  │              src/github/operations.ts                │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │  │ Rate Limiter│  │   Cache    │  │Retry Backoff │  │   │
│  │  └─────────────┘  └────────────┘  └─────────────┘  │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │           Formateo de Errores para LLM               │   │
│  │                src/errors/index.ts                   │   │
│  └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS / REST
                               ▼
              ┌────────────────────────────────┐
              │          API de GitHub          │
              │   api.github.com/repos/...      │
              └────────────────────────────────┘
```

### Estructura de archivos

```
ProyectoM5_JosueKalethSalazar/
├── src/
│   ├── server.ts              # Servidor MCP principal
│   ├── tools/                 # Una tool por archivo
│   │   ├── create-commit.ts
│   │   ├── create-repository.ts
│   │   ├── create-branch.ts
│   │   ├── create-issue.ts
│   │   ├── create-pull-request.ts
│   │   ├── get-file-content.ts
│   │   ├── list-issues.ts
│   │   ├── list-repositories.ts
│   │   └── add-collaborator.ts
│   ├── github/
│   │   ├── client.ts          # Instancia Octokit autenticada
│   │   └── operations.ts      # Lógica de negocio
│   ├── schemas/
│   │   └── index.ts           # Esquemas Zod + tipos TypeScript
│   ├── errors/
│   │   └── index.ts           # Traducción de errores para el LLM
│   └── utils/
│       ├── retry.ts            # Backoff exponencial
│       ├── rateLimiter.ts      # Control de solicitudes
│       ├── cache.ts            # Caché en memoria
│       └── logging.ts          # Logger estructurado
├── dist/                      # JavaScript compilado (generado)
├── .env                       # Variables de entorno (NO subir a git)
├── .env.example               # Plantilla de variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch (durante desarrollo)
npx vitest
```

Los tests están ubicados en la carpeta `src/tests/` y utilizan **Vitest** como framework de testing.

---

## 🔧 Troubleshooting

### ❌ Error: `GITHUB_TOKEN is not set`

**Causa:** El archivo `.env` no existe o no tiene el token configurado.

**Solución:**
```bash
# Verificá que existe el archivo .env
cat .env

# Si no existe, crealo
echo "GITHUB_TOKEN=ghp_tu_token_aqui" > .env
```

---

### ❌ Error: `401 Bad credentials`

**Causa:** El token de GitHub es inválido, está expirado o fue revocado.

**Solución:**
1. Andá a GitHub → Settings → Developer settings → Personal access tokens
2. Verificá que el token esté activo y no expirado
3. Generá un nuevo token si es necesario
4. Actualizá el valor en tu archivo `.env`

---

### ❌ Error: `403 Insufficient permissions`

**Causa:** El token no tiene los scopes necesarios.

**Solución:** Generá un nuevo token con los scopes `repo` y `user` habilitados (ver sección [Configuración](#2-scopes-necesarios-para-el-token)).

---

### ❌ Error: `404 Not Found` al hacer un commit

**Causa:** El repositorio o la rama especificada no existe, o el `owner` está mal escrito.

**Solución:**
1. Verificá el nombre exacto del repositorio en GitHub (respeta mayúsculas)
2. Verificá que el `owner` sea tu nombre de usuario de GitHub correcto
3. Si querés commitear a una rama específica, primero creala con `create_branch`

---

### ❌ Error: `409 Git Repository is empty` (versiones anteriores)

**Causa:** Este error era frecuente antes de la implementación del "Paso 0" inteligente.

**Estado actual:** ✅ **Ya está resuelto.** El servidor detecta automáticamente si el repositorio está vacío y lo inicializa antes de continuar.

---

### ❌ Error: `422 Unprocessable Entity`

**Causa:** La acción es lógicamente inválida. Por ejemplo:
- Intentar crear una rama que ya existe
- Abrir un PR cuando ya hay uno idéntico abierto

**Solución:** Verificá el estado actual del repositorio antes de ejecutar la acción (ej: `list_issues`, `list_repositories`).

---

### ❌ El servidor MCP no aparece conectado en el cliente

**Causa:** El servidor no arrancó correctamente o hubo un error de compilación.

**Solución:**
```bash
# Recompilar desde cero
rm -rf dist/
npm run build

# Verificar que el servidor arranca sin errores
npm start
```

---

### ❌ Error: `Cannot find module '...'`

**Causa:** Las dependencias no están instaladas o el proyecto no fue compilado.

**Solución:**
```bash
npm install
npm run build
```

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**.

```
MIT License

Copyright (c) 2026 Josue Kaleth Salazar
```

---

## 👨‍💻 Autor

**Josue Kaleth Salazar**  
Bootcamp FullStack — SoyHenry · Proyecto Integrador Módulo 5  
GitHub: [@Taimolrvz007](https://github.com/Taimolrvz007)