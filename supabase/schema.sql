-- ==============================================================================
-- SISTEMA DE CRÉDITO Y COBRANZA EN CAMPO ("OFICINA DIGITAL")
-- ESQUEMA COMPLETO POSTGRESQL + TRIGGERS + RLS PARA SUPABASE
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS ENUM PERSONALIZADOS
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('dueno', 'admin', 'supervisor', 'cobrador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE frecuencia_pago AS ENUM ('diario', 'semanal', 'quincenal', 'mensual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_interes AS ENUM ('fijo', 'sobre_saldo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_prestamo AS ENUM ('pendiente', 'aprobado', 'rechazado', 'activo', 'pagado', 'mora');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_cuota AS ENUM ('pendiente', 'parcial', 'pagada', 'atrasada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_pago AS ENUM ('cuota_completa', 'abono', 'no_pago');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_cierre AS ENUM ('abierto', 'pendiente_revision', 'aprobado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLA: OFICINAS (Empresas / Sucursales)
CREATE TABLE IF NOT EXISTS public.oficinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    telefono VARCHAR(50),
    excluir_domingos BOOLEAN DEFAULT TRUE,
    tasa_interes_defecto NUMERIC(5,2) DEFAULT 20.00,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_oficinas_updated_at
BEFORE UPDATE ON public.oficinas
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLA: PERFILES (Usuarios del sistema vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    oficina_id UUID REFERENCES public.oficinas(id) ON DELETE SET NULL, -- Null si es Dueño global
    supervisor_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL, -- Para cobradores
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    rol rol_usuario NOT NULL DEFAULT 'cobrador',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_perfiles_updated_at
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABLA: RUTAS DE COBRO
CREATE TABLE IF NOT EXISTS public.rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    cobrador_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    zona VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    ruta_id UUID REFERENCES public.rutas(id) ON DELETE SET NULL,
    cobrador_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    direccion TEXT NOT NULL,
    negocio VARCHAR(150),
    alias VARCHAR(100),
    orden_ruta INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_oficina_documento UNIQUE(oficina_id, documento)
);

CREATE TRIGGER tr_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABLA: PRESTAMOS
CREATE TABLE IF NOT EXISTS public.prestamos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL,
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    cobrador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    supervisor_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    
    capital NUMERIC(12,2) NOT NULL CHECK (capital > 0),
    tipo_interes tipo_interes NOT NULL DEFAULT 'fijo',
    tasa_interes NUMERIC(5,2) NOT NULL CHECK (tasa_interes >= 0),
    total_interes NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_a_pagar NUMERIC(12,2) NOT NULL CHECK (total_a_pagar >= capital),
    saldo_pendiente NUMERIC(12,2) NOT NULL,
    total_recaudado NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    frecuencia frecuencia_pago NOT NULL DEFAULT 'diario',
    num_cuotas INT NOT NULL CHECK (num_cuotas > 0),
    valor_cuota NUMERIC(12,2) NOT NULL,
    excluir_domingos BOOLEAN DEFAULT TRUE,
    
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_aprobacion TIMESTAMPTZ,
    fecha_desembolso TIMESTAMPTZ,
    fecha_primer_cobro DATE NOT NULL,
    fecha_vencimiento_final DATE,
    
    estado estado_prestamo NOT NULL DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_prestamos_updated_at
BEFORE UPDATE ON public.prestamos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TABLA: CUOTAS (Calendario / Amortización)
CREATE TABLE IF NOT EXISTS public.cuotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prestamo_id UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto_capital NUMERIC(12,2) NOT NULL,
    monto_interes NUMERIC(12,2) NOT NULL,
    monto_total NUMERIC(12,2) NOT NULL,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado estado_cuota NOT NULL DEFAULT 'pendiente',
    fecha_ultimo_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_prestamo_cuota UNIQUE(prestamo_id, numero_cuota)
);

-- 10. TABLA: PAGOS (Recaudos y Abonos en Calle)
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    prestamo_id UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
    cuota_id UUID REFERENCES public.cuotas(id) ON DELETE SET NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    cobrador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    tipo tipo_pago NOT NULL DEFAULT 'cuota_completa',
    motivo_no_pago TEXT,
    nota TEXT,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_pago TIME NOT NULL DEFAULT CURRENT_TIME,
    saldo_restante_despues NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: CIERRES DE CAJA (Arqueo Diario)
CREATE TABLE IF NOT EXISTS public.cierres_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oficina_id UUID NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
    cobrador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    supervisor_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    base_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_cobrado NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_desembolsado NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_gastos NUMERIC(12,2) NOT NULL DEFAULT 0,
    gastos_detalle JSONB DEFAULT '[]'::jsonb,
    efectivo_esperado NUMERIC(12,2) NOT NULL DEFAULT 0,
    efectivo_entregado NUMERIC(12,2) NOT NULL DEFAULT 0,
    diferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado estado_cierre NOT NULL DEFAULT 'abierto',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cobrador_fecha_cierre UNIQUE(cobrador_id, fecha)
);

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_oficina ON public.perfiles(oficina_id);
CREATE INDEX IF NOT EXISTS idx_clientes_oficina ON public.clientes(oficina_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ruta ON public.clientes(ruta_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_oficina ON public.prestamos(oficina_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_cliente ON public.prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON public.prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_prestamo ON public.cuotas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento ON public.cuotas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo ON public.pagos(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_cierres_cobrador_fecha ON public.cierres_caja(cobrador_id, fecha);

-- ==============================================================================
-- AUTOMATIZACIÓN DE PERFIL AL REGISTRAR USUARIO (AUTH.USERS TRIGGER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, telefono, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'cobrador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.oficinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

-- Helper: Obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS rol_usuario AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Obtener oficina_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_auth_oficina_id()
RETURNS UUID AS $$
  SELECT oficina_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLÍTICAS: OFICINAS
CREATE POLICY "Dueños gestionan todas las oficinas" ON public.oficinas
    FOR ALL USING (public.get_auth_role() = 'dueno');

CREATE POLICY "Usuarios ven su propia oficina" ON public.oficinas
    FOR SELECT USING (id = public.get_auth_oficina_id());

-- POLÍTICAS: PERFILES
CREATE POLICY "Dueño y Admin gestionan perfiles" ON public.perfiles
    FOR ALL USING (public.get_auth_role() IN ('dueno', 'admin'));

CREATE POLICY "Usuarios leen perfiles de su oficina" ON public.perfiles
    FOR SELECT USING (
      public.get_auth_role() = 'dueno' OR
      oficina_id = public.get_auth_oficina_id() OR
      id = auth.uid()
    );

-- POLÍTICAS: CLIENTES
CREATE POLICY "Dueño y Admin ven todos los clientes de la oficina" ON public.clientes
    FOR ALL USING (
      public.get_auth_role() = 'dueno' OR
      oficina_id = public.get_auth_oficina_id()
    );

-- POLÍTICAS: PRESTAMOS
CREATE POLICY "Dueño gestiona todos los préstamos" ON public.prestamos
    FOR ALL USING (public.get_auth_role() = 'dueno');

CREATE POLICY "Admin y Supervisor gestionan préstamos de su oficina" ON public.prestamos
    FOR ALL USING (
      oficina_id = public.get_auth_oficina_id() AND
      public.get_auth_role() IN ('admin', 'supervisor')
    );

CREATE POLICY "Cobrador ve sus propios préstamos" ON public.prestamos
    FOR SELECT USING (
      oficina_id = public.get_auth_oficina_id() AND
      cobrador_id = auth.uid()
    );

CREATE POLICY "Cobrador inserta préstamos en estado pendiente" ON public.prestamos
    FOR INSERT WITH CHECK (
      oficina_id = public.get_auth_oficina_id() AND
      cobrador_id = auth.uid() AND
      estado = 'pendiente'
    );

-- POLÍTICAS: CUOTAS
CREATE POLICY "Lectura de cuotas por oficina" ON public.cuotas
    FOR SELECT USING (
      public.get_auth_role() = 'dueno' OR
      oficina_id = public.get_auth_oficina_id()
    );

CREATE POLICY "Modificación de cuotas" ON public.cuotas
    FOR ALL USING (
      public.get_auth_role() IN ('dueno', 'admin', 'supervisor') OR
      oficina_id = public.get_auth_oficina_id()
    );

-- POLÍTICAS: PAGOS
CREATE POLICY "Lectura de pagos" ON public.pagos
    FOR SELECT USING (
      public.get_auth_role() = 'dueno' OR
      oficina_id = public.get_auth_oficina_id()
    );

CREATE POLICY "Cobrador inserta pagos en su oficina" ON public.pagos
    FOR INSERT WITH CHECK (
      oficina_id = public.get_auth_oficina_id() AND
      cobrador_id = auth.uid()
    );

-- POLÍTICAS: CIERRES DE CAJA
CREATE POLICY "Dueño y Admin ven todos los cierres" ON public.cierres_caja
    FOR SELECT USING (
      public.get_auth_role() IN ('dueno', 'admin') OR
      (public.get_auth_role() = 'supervisor' AND oficina_id = public.get_auth_oficina_id())
    );

CREATE POLICY "Cobrador gestiona su propio cierre diario" ON public.cierres_caja
    FOR ALL USING (
      cobrador_id = auth.uid() AND
      oficina_id = public.get_auth_oficina_id()
    );

-- ==============================================================================
-- OFICINA SEMILLA INICIAL PARA ARRANCAR
-- ==============================================================================
INSERT INTO public.oficinas (id, nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto)
VALUES ('11111111-1111-1111-1111-111111111111', 'Oficina Central Medellín', 'Medellín', '300 456 7890', true, 20.00)
ON CONFLICT (id) DO NOTHING;
