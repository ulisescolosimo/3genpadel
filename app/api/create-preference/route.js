import { NextResponse } from 'next/server'
import mercadopago from 'mercadopago'

// Configurar MercadoPago
mercadopago.configure({
  access_token: 'APP_USR-230150128729554-030823-ce3375f9f49af880d857cf865d25a1c8-379222509'
})

export async function POST(request) {
  try {
    const { tournament } = await request.json()

    // Crear la preferencia de pago
    const preference = {
      items: [
        {
          title: `Inscripción - ${tournament.name}`,
          unit_price: tournament.price,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: tournament.id
    }

    const response = await mercadopago.preferences.create(preference)

    return NextResponse.json({
      preferenceId: response.body.id,
      init_point: response.body.init_point
    })
  } catch (error) {
    console.error('Error al crear la preferencia:', error)
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    )
  }
} 