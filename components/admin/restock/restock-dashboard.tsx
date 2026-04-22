'use client';

import { useEffect, useState } from 'react';
import { getRestockRequests } from '@/app/actions/restock';
import { RestockRequest } from '@/lib/types/restock';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function RestockDashboard() {
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await getRestockRequests();
    if (data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const pending = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;
  const received = requests.filter((r) => r.status === 'received').length;

  const statCards = [
    {
      title: 'Total Orders',
      value: requests.length,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Pending Approval',
      value: pending,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Approved',
      value: approved,
      icon: CheckCircle,
      color: 'blue',
    },
    {
      title: 'Received',
      value: received,
      icon: AlertCircle,
      color: 'purple',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const colorClasses = {
          green: 'border-green-200 bg-green-50',
          yellow: 'border-yellow-200 bg-yellow-50',
          blue: 'border-blue-200 bg-blue-50',
          purple: 'border-purple-200 bg-purple-50',
        };

        const iconColorClasses = {
          green: 'text-green-600',
          yellow: 'text-yellow-600',
          blue: 'text-blue-600',
          purple: 'text-purple-600',
        };

        return (
          <div key={stat.title} className={`border rounded-lg p-6 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '-' : stat.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${iconColorClasses[stat.color as keyof typeof iconColorClasses]}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
