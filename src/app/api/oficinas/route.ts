import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto } = body;

    if (!nombre || !ciudad) {
      return NextResponse.json(
        { success: false, error: 'El nombre y la ciudad de la oficina son obligatorios.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured || !sql) {
      return NextResponse.json({
        success: true,
        simulated: true,
        oficina: {
          id: `ofi-${Date.now()}`,
          nombre,
          ciudad,
          telefono: telefono || '',
          excluir_domingos: excluir_domingos ?? true,
          tasa_interes_defecto: Number(tasa_interes_defecto ?? 20),
          activa: true,
          created_at: new Date().toISOString().split('T')[0],
        },
      });
    }

    const res = await sql`
      INSERT INTO oficinas (nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto, activa)
      VALUES (${nombre.trim()}, ${ciudad.trim()}, ${telefono?.trim() || null}, ${Boolean(excluir_domingos ?? true)}, ${Number(tasa_interes_defecto ?? 20)}, true)
      RETURNING *
    `;

    return NextResponse.json({ success: true, oficina: res[0] });
  } catch (error: unknown) {
    console.error('Error al crear oficina:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la oficina.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto, activa } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de oficina requerido.' }, { status: 400 });
    }

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    const res = await sql`
      UPDATE oficinas
      SET
        nombre = COALESCE(${nombre || null}, nombre),
        ciudad = COALESCE(${ciudad || null}, ciudad),
        telefono = COALESCE(${telefono || null}, telefono),
        excluir_domingos = COALESCE(${typeof excluir_domingos === 'boolean' ? excluir_domingos : null}, excluir_domingos),
        tasa_interes_defecto = COALESCE(${tasa_interes_defecto !== undefined ? Number(tasa_interes_defecto) : null}, tasa_interes_defecto),
        activa = COALESCE(${typeof activa === 'boolean' ? activa : null}, activa)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, oficina: res[0] });
  } catch (error: unknown) {
    console.error('Error al actualizar oficina:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar la configuración de oficina.' }, { status: 500 });
  }
}
