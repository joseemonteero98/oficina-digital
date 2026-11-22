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
      barrio,
      referencia_ubicacion,
      negocio,
      alias,
    } = body;

    if (!nombre_completo || !documento || !telefono || !direccion) {
      return NextResponse.json(
        { success: false, error: 'Nombre completo, documento, teléfono y dirección son obligatorios.' },
        { status: 400 }
      );
    }

    const barrioFinal = (barrio || alias || 'VALLEDUPAR').trim().toUpperCase();
    const direccionFinal = referencia_ubicacion
      ? `${direccion.trim()} (${referencia_ubicacion.trim()})`
      : direccion.trim();

    if (!isDbConfigured || !sql) {
      return NextResponse.json({
        success: true,
        simulated: true,
        cliente: {
          id: `cli-${Date.now()}`,
          oficina_id,
          ruta_id,
          cobrador_id,
          nombre_completo,
          documento,
          telefono,
          direccion: direccionFinal,
          barrio: barrioFinal,
          negocio,
          alias: barrioFinal,
          orden_ruta: 99,
          activo: true,
          created_at: new Date().toISOString().split('T')[0],
        },
      });
    }

    // Validar duplicado por número de documento en la oficina
    const dup = await sql`
      SELECT id, nombre_completo FROM clientes 
      WHERE oficina_id = ${oficina_id} AND documento = ${documento.trim()}
      LIMIT 1
    `;
    if (dup.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un cliente registrado con este documento (${dup[0].nombre_completo}).`,
        },
        { status: 409 }
      );
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
        ${nombre_completo.trim()},
        ${documento.trim()},
        ${telefono.trim()},
        ${direccionFinal},
        ${negocio?.trim() || null},
        ${barrioFinal}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      cliente: {
        ...res[0],
        barrio: barrioFinal,
      },
    });
  } catch (error: unknown) {
    console.error('Error al registrar cliente en DB:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo registrar el cliente. Verifica los datos e inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
