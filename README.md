# 🏃‍♂️ Proff IA — Tu Entrenador Personal Inteligente para Running y Fútbol

> **Desarrollado y Creado por [Freddy Ramirez](https://www.linkedin.com/in/freddyramirezv/)**

Proff IA es una plataforma moderna, inteligente y 100% responsive diseñada para atletas que buscan optimizar su rendimiento físico y alcanzar objetivos ambiciosos (como quebrar la barrera de los **4:30 min/km** en 10K/5K). Integra modelos de Inteligencia Artificial Multimodal para interpretar capturas de pantalla de relojes deportivos (Huawei Health, Garmin, Strava, Polar, Apple Watch), estructurar entrenamientos por bloques fisiológicos y ofrecer diagnósticos técnicos en tiempo real.

---

## ✨ Características Principales

* 🤖 **Coach Deportivo con IA Multimodal:** Chat deportivo avanzado que recuerda tu historial real, ritmos y zonas cardíacas. Permite adjuntar o pegar fotos (`Ctrl+V`) y dictar por voz.
* 📸 **Ingesta Inteligente de Entrenamientos (Foto & Portapapeles):** Sube o pega capturas de tu reloj inteligente y la IA extraerá automáticamente distancia, tiempo, ritmo medio, frecuencia cardíaca máxima/promedio, cadencia y calorías.
* 🎯 **Macrociclo Estructurado de 6 Semanas:** Periodización científica dividida en 8 bloques estructurados por sesión (Calentamiento, Bloque Principal, Recuperación, Enfriamiento, Enfoque Técnico, Zonas Cardíacas y Nutrición).
* 🔄 **Auto-Completado y Vinculación:** Al registrar o editar un entrenamiento, puedes asociarlo a un día del plan para marcarlo como completado automáticamente.
* 📊 **Dashboard y Métricas Reales:** Estadísticas dinámicas de volumen semanal, ritmo promedio, evolución cardiovascular y distribución por deportes (Running, Fútbol, Gym).
* 📱 **Progressive Web App (PWA) & 100% Responsive:** Diseñado para teléfonos, tablets y computadoras. Se instala como aplicación nativa en iOS y Android con soporte offline.
* 🔒 **Seguridad y Persistencia en la Nube:** Autenticación y base de datos relacional PostgreSQL en tiempo real con Supabase.

---

## 🛠️ Stack Tecnológico

### Frontend (`fitcoach-ai`)
* **Framework:** React 19 + TypeScript + Vite
* **Estilos:** TailwindCSS + Vanilla CSS Moderno (Glassmorphism, Dark Theme, animaciones suaves)
* **Iconografía:** Lucide React
* **Estado y Rutas:** React Router 7 + Context API (PlanContext, AuthContext, ModalContext)
* **PWA:** Web App Manifest + Service Worker nativo para instalación en dispositivos móviles

### Backend (`fitcoach-api`)
* **Entorno:** Node.js + Express + TypeScript
* **IA & Visión:** Fireworks AI (`qwen3p7-plus` / `llama-v3p3-70b-instruct`)
* **Base de Datos & Auth:** Supabase (PostgreSQL + Row Level Security + Auth)
* **Despliegue:** Serverless Functions

---

## 📁 Estructura del Proyecto (Monorepo)

```text
├── api/                    # Entrypoint Serverless
│   └── index.ts
├── fitcoach-ai/            # Aplicación Frontend (Vite + React SPA)
│   ├── public/             # Iconos, Manifest PWA y Service Worker
│   ├── src/
│   │   ├── components/     # Modales (DayDetailModal, SessionDetailModal, RegisterModal)
│   │   ├── contexts/       # PlanContext, AuthContext, ModalContext
│   │   ├── pages/          # Dashboard, Plan, History, Chat, Calendar, Profile
│   │   └── services/       # Cliente API dinámico
│   └── package.json
├── fitcoach-api/           # Servidor Backend (Express API)
│   ├── src/
│   │   ├── routes/         # Rutas de IA (/ai), Sesiones (/sessions), Huawei (/huawei)
│   │   ├── services/       # Integración con Fireworks AI y Supabase Admin
│   │   └── index.ts
│   └── package.json
├── vercel.json             # Configuración de despliegue unificado
├── package.json            # Scripts de monorepo con npm workspaces
└── README.md
```

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/fredara/fitcoach-ai.git
cd fitcoach-ai
```

### 2. Instalar dependencias
Al ser un monorepo con workspaces, puedes instalar todo desde la raíz:
```bash
npm install
```

### 3. Configurar variables de entorno

#### Frontend (`fitcoach-ai/.env.local`)
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

#### Backend (`fitcoach-api/.env`)
```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key-de-supabase
FIREWORKS_API_KEY=tu-fireworks-api-key
AI_MODEL=accounts/fireworks/models/qwen3p7-plus
HUAWEI_CLIENT_ID=tu-huawei-client-id (opcional)
HUAWEI_CLIENT_SECRET=tu-huawei-client-secret (opcional)
```

### 4. Iniciar servidores de desarrollo

* **Iniciar Frontend:**
```bash
npm run dev --workspace=fitcoach-ai
```
*Accede a:* `http://localhost:5173`

* **Iniciar Backend:**
```bash
npm run dev --workspace=fitcoach-api
```
*Accede a:* `http://localhost:3000`

---

## 👤 Autor

* **Creador & Desarrollador Principal:** [Freddy Ramirez](https://www.linkedin.com/in/freddyramirezv/)
* **Proyecto:** Proff IA Platform

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Eres libre de usarlo, modificarlo y adaptarlo a tus necesidades de entrenamiento deportivo.
