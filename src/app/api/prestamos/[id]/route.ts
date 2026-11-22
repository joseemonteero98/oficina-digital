import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { accion, supervisor_id, motivo_rechazo, metodo_desembolso } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true, id, accion });
    }

    const existing = await sql`SELECT * FROM prestamos WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Préstamo no encontrado.' },
        { status: 404 }
      );
    }

    const prestamo = existing[0];

    if (accion === 'aprobar') {
      if (prestamo.estado !== 'pendiente') {
        return NextResponse.json(
          { success: false, error: 'Solo se pueden aprobar solicitudes en estado pendiente.' },
          { status: 400 }
        );
      }
      if (supervisor_id && supervisor_id === prestamo.cobrador_id) {
        return NextResponse.json(
          { success: false, error: 'El cobrador no puede aprobar su propia solicitud.' },
          { status: 403 }
        );
      }

      await sql`
        UPDATE prestamos
        SET 
          estado = 'aprobado',
          supervisor_id = ${supervisor_id || null},
          fecha_aprobacion = NOW()
        WHERE id = ${id}
      `;
    } else if (accion === 'rechazar') {
      if (!motivo_rechazo || !String(motivo_rechazo).trim()) {
        return NextResponse.json(
          { success: false, error: 'Debes indicar el motivo del rechazo.' },
          { status: 400 }
        );
      }
      await sql`
        UPDATE prestamos
        SET 
          estado = 'rechazado',
          supervisor_id = ${supervisor_id || null},
          motivo_rechazo = ${String(motivo_rechazo).trim()}
        WHERE id = ${id}
      `;
    } else if (accion === 'solicitar_ajuste') {
      const notaAjuste = `[AJUSTE SOLICITADO POR SUPERVISOR]: ${motivo_rechazo || 'Revisar condiciones'}`;
      const nuevasNotas = prestamo.notas ? `${prestamo.notas}\n${notaAjuste}` : notaAjuste;
      await sql`
        UPDATE prestamos
        SET 
          supervisor_id = ${supervisor_id || null},
          notas = ${nuevasNotas}
        WHERE id = ${id}
      `;
    } else if (accion === 'desembolsar') {
      if (prestamo.estado !== 'aprobado') {
        return NextResponse.json(
          { success: false, error: 'El préstamo debe estar aprobado antes de desembolsarse.' },
          { status: 400 }
        );
      }

      await sql`
        UPDATE prestamos
        SET 
          estado = 'activo',
          fecha_desembolso = NOW()
        WHERE id = ${id}
      `;

      // Si el desembolso fue en efectivo (por defecto), descontar en el cierre de caja del día
      if (metodo_desembolso !== 'transferencia') {
        const capitalNum = Number(prestamo.capital);
        const existingCierre = await sql`
          SELECT * FROM cierres_caja 
          WHERE cobrador_id = ${prestamo.cobrador_id} AND fecha = CURRENT_DATE
          LIMIT 1
        `;
        if (existingCierre.length > 0) {
          const c = existingCierre[0];
          const nuevoDesembolsado = Number(c.total_desembolsado) + capitalNum;
          const nuevoEsperado = Number(c.efectivo_esperado) - capitalNum;
          await sql`
            UPDATE cierres_caja
            SET total_desembolsado = ${nuevoDesembolsado}, efectivo_esperado = ${nuevoEsperado}
            WHERE id = ${c.id}
          `;
        } else {
          await sql`
            INSERT INTO cierres_caja (
              oficina_id, cobrador_id, fecha, base_inicial, total_cobrado, total_desembolsado, total_gastos, efectivo_esperado, efectivo_entregado, diferencia, estado
            ) VALUES (
              ${prestamo.oficina_id}, ${prestamo.cobrador_id}, CURRENT_DATE, 250000, 0, ${capitalNum}, 0, ${250000 - capitalNum}, ${250000 - capitalNum}, 0, 'abierto'
            )
          `;
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción no reconocida.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id, accion });
  } catch (error: unknown) {
    console.error('Error al actualizar préstamo en DB:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo actualizar el préstamo en el servidor.' },
      { status: 500 }
    );
  }
}
