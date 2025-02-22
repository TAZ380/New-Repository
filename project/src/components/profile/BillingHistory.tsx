import React from 'react';
import { Download, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  invoice_url?: string;
}

interface BillingHistoryProps {
  payments: Payment[];
}

export function BillingHistory({ payments }: BillingHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay pagos registrados</h3>
        <p className="text-gray-500 mt-2">
          Tu historial de facturación aparecerá aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
        >
          <div>
            <div className="font-medium text-gray-900">
              {format(new Date(payment.date), "d 'de' MMMM, yyyy", { locale: es })}
            </div>
            <div className="text-sm text-gray-500">
              {payment.method}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-900">
              {payment.amount.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </span>
            {payment.invoice_url && (
              <a
                href={payment.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Download className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}