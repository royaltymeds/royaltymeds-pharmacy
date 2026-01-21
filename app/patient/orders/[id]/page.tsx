import { Suspense } from 'react';
import OrderDetailsClient from './page-client';

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderDetailsClient orderId={id} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-600">Loading order details...</div>
      </div>
    </div>
  );
}

