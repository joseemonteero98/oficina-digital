-- ==============================================================================
-- DATOS SEMILLA PARA PRUEBAS (OFICINA DIGITAL)
-- ==============================================================================

-- 1. Oficinas de demostración
INSERT INTO public.oficinas (id, nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto) VALUES
('11111111-1111-1111-1111-111111111111', 'Oficina Central Medellín', 'Medellín', '3001234567', true, 20.00),
('22222222-2222-2222-2222-222222222222', 'Oficina Bogotá Sur', 'Bogotá', '3109876543', true, 20.00)
ON CONFLICT (id) DO NOTHING;

-- Nota: Para insertar perfiles en Supabase real, primero deben registrarse los usuarios en auth.users.
-- En la aplicación web contamos con un proveedor de estado interactivo precargado para probar todos los roles de inmediato.
