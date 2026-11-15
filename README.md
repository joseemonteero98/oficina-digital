# 🏢 Oficina Digital — Sistema de Gestión de Préstamos y Cobros

Sistema de microfinanzas y crédito en campo diseñado para reemplazar el control en papel y cuadernos de prestamistas ("paga diario" formalizado).

---

## 🎯 Jerarquía de Roles

- **👑 Dueño:** Visión global consolidada de todas las oficinas/sucursales, capital total en calle, recaudo nacional y margen de utilidad.
- **👔 Administrador:** Jefe directo de los Supervisores dentro de su oficina asignada. Gestiona usuarios, reglas de crédito y audita la cartera.
- **🛡️ Supervisor:** Opera en la "Oficina". Verifica y autoriza préstamos creados por los cobradores, supervisa rutas y audita el cuadre/arqueo de caja diario.
- **🛵 Cobrador:** En la calle desde su smartphone. Registra clientes, solicita préstamos, entrega el efectivo aprobado, cobra cuotas diarias/semanales con recibos digitales para WhatsApp, y rinde cuentas en el arqueo diario.

---

## 🧮 Modalidades de Crédito Soportadas

1. **Interés Fijo Simple (Paga diario clásico):** Cuotas niveladas iguales con interés fijado sobre el capital inicial.
2. **Interés sobre Saldo (Amortización francesa):** Cuota calculada sobre saldo deudor con amortización periódica.
3. **Frecuencias:** Diario (con exclusión automática de domingos), Semanal, Quincenal y Mensual.

---

## 🚀 Despliegue en Supabase, GitHub y Vercel

### 1. Base de Datos en Supabase
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
3. Copia tu `URL` del proyecto y tu `anon public key` desde **Project Settings > API**.

### 2. Variables de Entorno
Crea un archivo `.env.local` con tus credenciales:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. Subir a GitHub
```bash
git add .
git commit -m "feat: Sistema de préstamos y cobranza Oficina Digital (MVP)"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/oficina-digital.git
git push -u origin main
```

### 4. Despliegue en Vercel
1. Conecta el repositorio de GitHub en [Vercel](https://vercel.com).
2. Agrega las dos variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Haz clic en **Deploy**. ¡Listo!
