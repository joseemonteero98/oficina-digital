import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre_completo, documento, telefono, rol, oficina_id, supervisor_id } = body;

    if (!nombre_completo || !documento || !rol) {
      return NextResponse.json(
        { success: false, error: 'Nombre, cédula y rol son obligatorios.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured || !sql) {
      return NextResponse.json({
        success: true,
        simulated: true,
        usuario: {
          id: `usr-${Date.now()}`,
          oficina_id: oficina_id || null,
          supervisor_id: supervisor_id || null,
          nombre_completo,
          documento,
          telefono: telefono || '',
          rol,
          activo: true,
          created_at: new Date().toISOString().split('T')[0],
        },
      });
    }

    const dup = await sql`SELECT id FROM usuarios WHERE documento = ${documento.trim()} LIMIT 1`;
    if (dup.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese documento.' },
        { status: 409 }
      );
    }

    const res = await sql`
      INSERT INTO usuarios (oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo)
      VALUES (${oficina_id || null}, ${supervisor_id || null}, ${nombre_completo.trim()}, ${documento.trim()}, ${telefono?.trim() || null}, ${rol}, true)
      RETURNING id, oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo, created_at
    `;

    return NextResponse.json({ success: true, usuario: res[0] });
  } catch (error: unknown) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar el usuario.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre_completo, telefono, oficina_id, supervisor_id, rol, activo } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido.' }, { status: 400 });
    }

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    const res = await sql`
      UPDATE usuarios
      SET
        nombre_completo = COALESCE(${nombre_completo || null}, nombre_completo),
        telefono = COALESCE(${telefono || null}, telefono),
        oficina_id = COALESCE(${oficina_id !== undefined ? oficina_id : null}, oficina_id),
        supervisor_id = COALESCE(${supervisor_id !== undefined ? supervisor_id : null}, supervisor_id),
        rol = COALESCE(${rol || null}, rol),
        activo = COALESCE(${typeof activo === 'boolean' ? activo : null}, activo)
      WHERE id = ${id}
      RETURNING id, oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo, created_at
    `;

    return NextResponse.json({ success: true, usuario: res[0] });
  } catch (error: unknown) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar el usuario.' }, { status: 500 });
  }
}
