import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { accion, supervisor_id, motivo_rechazo } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    if (accion === 'aprobar') {
      await sql`
        UPDATE prestamos
        SET 
          estado = 'aprobado',
          supervisor_id = ${supervisor_id || null},
          fecha_aprobacion = NOW()
        WHERE id = ${id}
      `;
    } else if (accion === 'rechazar') {
      await sql`
        UPDATE prestamos
        SET 
          estado = 'rechazado',
          supervisor_id = ${supervisor_id || null},
          motivo_rechazo = ${motivo_rechazo || 'No apto'}
        WHERE id = ${id}
      `;
    } else if (accion === 'desembolsar') {
      await sql`
        UPDATE prestamos
        SET 
          estado = 'activo',
          fecha_desembolso = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true, id, accion });
  } catch (error: any) {
    console.error('Error al actualizar préstamo en DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
