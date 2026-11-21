import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      oficina_id,
      ruta_id,
      cobrador_id,
      nombre_completo,
      documento,
      telefono,
      direccion,
      negocio,
      alias,
    } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    const res = await sql`
      INSERT INTO clientes (
        oficina_id,
        ruta_id,
        cobrador_id,
        nombre_completo,
        documento,
        telefono,
        direccion,
        negocio,
        alias
      ) VALUES (
        ${oficina_id},
        ${ruta_id || null},
        ${cobrador_id || null},
        ${nombre_completo},
        ${documento},
        ${telefono},
        ${direccion},
        ${negocio || null},
        ${alias || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, cliente: res[0] });
  } catch (error: any) {
    console.error('Error al registrar cliente en DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
