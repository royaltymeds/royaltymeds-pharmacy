import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { amount, orderId } = await req.json();

    if (!amount || !orderId) {
      return Response.json(
        { error: 'Missing amount or orderId' },
        { status: 400 }
      );
    }

    if (!process.env.FYGARO_API_SECRET_KEY || !process.env.FYGARO_API_PUBLIC_KEY) {
      return Response.json(
        { error: 'Fygaro keys not configured' },
        { status: 500 }
      );
    }

    // Ensure amount is formatted as string with exactly 2 decimal places
    let formattedAmount: string;
    if (typeof amount === 'string') {
      formattedAmount = parseFloat(amount).toFixed(2);
    } else if (typeof amount === 'number') {
      formattedAmount = amount.toFixed(2);
    } else {
      return Response.json(
        { error: 'Amount must be a number or string' },
        { status: 400 }
      );
    }

    // JWT payload with all required fields
    const payload = {
      amount: formattedAmount,
      currency: 'JMD',
      custom_reference: orderId,
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiration
    };

    // console.log('JWT Payload:', JSON.stringify(payload));
    // console.log('Public Key:', process.env.FYGARO_API_PUBLIC_KEY);

    // Sign JWT with secret key
    const token = jwt.sign(payload, process.env.FYGARO_API_SECRET_KEY, {
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        typ: 'JWT',
        kid: process.env.FYGARO_API_PUBLIC_KEY,
      },
    } as jwt.SignOptions);

    // console.log('JWT Token Generated:', token);

    // Fygaro payment link with JWT token
    const paymentUrl = `https://www.fygaro.com/en/pb/e3df4b61-668c-43e3-9b02-623ac3f534ef/?jwt=${token}`;

    return Response.json({ url: paymentUrl });
  } catch (error) {
    console.error('Payment token generation failed:', error);
    return Response.json(
      { error: 'Failed to generate payment token' },
      { status: 500 }
    );
  }
}
