import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json();

    // Validate inputs
    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing orderId or amount' },
        { status: 400 }
      );
    }

    // Validate amount is positive number
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create JWT payload with payment details
    const payload = {
      amount: amount.toFixed(2),
      currency: 'JMD',
      custom_reference: orderId,
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minute expiration
    };

    // Sign JWT with Fygaro secret key
    const token = jwt.sign(payload, process.env.FYGARO_API_SECRET_KEY!, {
      algorithm: 'HS256',
    });

    // Return checkout URL with JWT
    const checkoutUrl = `${process.env.FYGARO_LINK}?jwt=${token}`;

    return NextResponse.json({
      success: true,
      url: checkoutUrl,
      orderId,
      amount,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
