import React from 'react';
import { Crown, ChevronRight, Star, Clock, Headphones, Book } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PremiumCardProps {
  subscriptionStatus: 'free' | 'premium';
  subscriptionEndDate?: string;
  onManageSubscription: () => void;
}

export function PremiumCard({ subscriptionStatus, subscriptionEndDate, onManageSubscription }: PremiumCardProps) {
  const isPremium = subscriptionStatus === 'premium';

  return (
    <div className="bg-[#FFF8E1] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 rounded-lg p-2">
              <Crown className="h-6 w-6 text-amber-700" />
            </div>
            <h3 className="text-lg font-semibold text-amber-900">Premium</h3>
          </div>
          {isPremium && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              Activo
            </span>
          )}
        </div>

        {/* Status Message */}
        <div className="mb-6">
          {isPremium ? (
            <p className="text-amber-800">
              Eres usuario Premium hasta el {format(new Date(subscriptionEndDate!), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          ) : (
            <p className="text-amber-800">
              No tienes suscripción activa. ¡Prueba 14 días gratis!
            </p>
          )}
        </div>

        {/* Benefits List */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-amber-800">
            <Star className="h-5 w-5 text-amber-600" />
            <span>Acceso prioritario a ofertas de trabajo</span>
          </div>
          <div className="flex items-center gap-3 text-amber-800">
            <Book className="h-5 w-5 text-amber-600" />
            <span>Formación exclusiva y descuentos en cursos</span>
          </div>
          <div className="flex items-center gap-3 text-amber-800">
            <Headphones className="h-5 w-5 text-amber-600" />
            <span>Soporte prioritario 24/7</span>
          </div>
          <div className="flex items-center gap-3 text-amber-800">
            <Clock className="h-5 w-5 text-amber-600" />
            <span>Vademécum sin límites (Free: 2h/mes)</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onManageSubscription}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
        >
          <span>{isPremium ? 'Gestionar Suscripción' : 'Hazte Premium'}</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}