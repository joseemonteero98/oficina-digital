import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre_completo, telefono, direccion, barrio, negocio } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true, id });
    }

    const res = await sql`
      UPDATE clientes
      SET
        nombre_completo = COALESCE(${nombre_completo || null}, nombre_completo),
        telefono = COALESCE(${telefono || null}, telefono),
        direccion = COALESCE(${direccion || null}, direccion),
        alias = COALESCE(${barrio ? String(barrio).toUpperCase() : null}, alias),
        negocio = COALESCE(${negocio || null}, negocio)
      WHERE id = ${id}
      RETURNING *
    `;

    if (res.length === 0) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cliente: res[0] });
  } catch (error: unknown) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo actualizar la información del cliente.' },
      { status: 500 }
    );
  }
}
