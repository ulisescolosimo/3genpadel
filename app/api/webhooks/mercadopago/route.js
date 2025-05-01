import { NextResponse } from 'next/server'
import mercadopago from 'mercadopago'
import { supabase } from '@/lib/supabase'

// Configurar MercadoPago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Verificar que la notificación sea de MercadoPago
    if (type !== 'payment') {
      return NextResponse.json({ message: 'Not a payment notification' }, { status: 400 })
    }

    // Obtener el pago
    const payment = await mercadopago.payment.findById(data.id)
    const paymentData = payment.body

    // Verificar el estado del pago
    if (paymentData.status === 'approved') {
      // Actualizar la inscripción en la base de datos
      const { error } = await supabase
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('tournament_id', paymentData.external_reference)

      if (error) {
        console.error('Error al actualizar la inscripción:', error)
        return NextResponse.json(
          { error: 'Error al actualizar la inscripción' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error al procesar el webhook:', error)
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 500 }
    )
  }
} 