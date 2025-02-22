import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  Star,
  Building,
  AlertCircle,
  X,
  Plus,
  Settings,
  Loader2,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunset
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

// Interfaces
interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  icon: React.ReactNode;
  duration: number;
  isCustom?: boolean;
}

interface DayShift {
  date: Date;
  shifts: Shift[];
  note?: string;
}

// Predefined shifts
const PREDEFINED_SHIFTS: Shift[] = [
  {
    id: 'morning',
    name: 'Mañana',
    startTime: '07:00',
    endTime: '15:00',
    color: 'bg-yellow-100',
    icon: <Sun className="h-5 w-5 text-yellow-600" />,
    duration: 8
  },
  {
    id: 'afternoon',
    name: 'Tarde',
    startTime: '15:00',
    endTime: '23:00',
    color: 'bg-orange-100',
    icon: <Sunset className="h-5 w-5 text-orange-600" />,
    duration: 8
  },
  {
    id: 'night',
    name: 'Noche',
    startTime: '23:00',
    endTime: '07:00',
    color: 'bg-blue-100',
    icon: <Moon className="h-5 w-5 text-blue-600" />,
    duration: 8
  },
  {
    id: 'day12',
    name: '12H Día',
    startTime: '07:00',
    endTime: '19:00',
    color: 'bg-green-100',
    icon: <Sun className="h-5 w-5 text-green-600" />,
    duration: 12
  },
  {
    id: 'night12',
    name: '12H Noche',
    startTime: '19:00',
    endTime: '07:00',
    color: 'bg-purple-100',
    icon: <Moon className="h-5 w-5 text-purple-600" />,
    duration: 12
  }
];

function ShiftManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<Record<string, DayShift>>({});
  const [customShifts, setCustomShifts] = useState<Shift[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showCustomShiftForm, setShowCustomShiftForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomShift, setNewCustomShift] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: 'bg-gray-100'
  });
  const [showCustomShiftEditor, setShowCustomShiftEditor] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load custom shifts
      const { data: customShiftsData, error: customShiftsError } = await supabase
        .from('nurse_custom_shifts')
        .select('*')
        .eq('nurse_id', user.id);

      if (customShiftsError) throw customShiftsError;

      const formattedCustomShifts = customShiftsData.map(shift => ({
        id: shift.id,
        name: shift.name,
        startTime: shift.start_time,
        endTime: shift.end_time,
        color: shift.color,
        icon: shift.name.charAt(0).toUpperCase(),
        duration: calculateDuration(shift.start_time, shift.end_time),
        isCustom: true
      }));

      setCustomShifts(formattedCustomShifts);

      // Load assigned shifts
      const { data: assignedShifts, error: assignedShiftsError } = await supabase
        .from('nurse_shifts')
        .select('*')
        .eq('nurse_id', user.id);

      if (assignedShiftsError) throw assignedShiftsError;

      const shiftsMap: Record<string, DayShift> = {};
      assignedShifts?.forEach(shift => {
        const dateKey = shift.date;
        if (!shiftsMap[dateKey]) {
          shiftsMap[dateKey] = {
            date: new Date(shift.date),
            shifts: [],
            note: shift.notes
          };
        }
        
        const shiftData = shift.custom_shift_id
          ? customShifts.find(cs => cs.id === shift.custom_shift_id)
          : PREDEFINED_SHIFTS.find(ps => ps.id === shift.shift_type);

        if (shiftData) {
          shiftsMap[dateKey].shifts.push({
            ...shiftData,
            startTime: shift.start_time,
            endTime: shift.end_time
          });
        }
      });

      setShifts(shiftsMap);
    } catch (err) {
      console.error('Error loading shifts:', err);
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour > startHour ? endHour - startHour : 24 - startHour + endHour;
  };

  const addShift = async (date: Date, shift: Shift) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const currentShifts = shifts[dateKey]?.shifts || [];

      if (currentShifts.length >= 2) {
        setError('Solo puedes añadir hasta 2 turnos por día.');
        return;
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error: shiftError } = await supabase
        .from('nurse_shifts')
        .insert([{
          nurse_id: user.id,
          date: dateKey,
          shift_type: shift.isCustom ? null : shift.id,
          custom_shift_id: shift.isCustom ? shift.id : null,
          start_time: shift.startTime,
          end_time: shift.endTime,
          color: shift.color,
          location: '', // Set empty string as default
          status: 'pending'
        }]);

      if (shiftError) throw shiftError;

      // Sort shifts by start time
      const newShifts = [...currentShifts, shift].sort((a, b) => {
        const timeA = new Date(`2000-01-01T${a.startTime}`).getTime();
        const timeB = new Date(`2000-01-01T${b.startTime}`).getTime();
        return timeA - timeB;
      });

      setShifts(prev => ({
        ...prev,
        [dateKey]: {
          date,
          shifts: newShifts,
          note: prev[dateKey]?.note
        }
      }));

      setError(null);
    } catch (err) {
      setError('Error al agregar el turno');
      console.error('Error adding shift:', err);
    }
  };

  const removeShift = async (date: Date, shiftToRemove: Shift) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      
      // Remove from database
      const { error: deleteError } = await supabase
        .from('nurse_shifts')
        .delete()
        .match({
          date: dateKey,
          ...(shiftToRemove.isCustom 
            ? { custom_shift_id: shiftToRemove.id }
            : { shift_type: shiftToRemove.id })
        });

      if (deleteError) throw deleteError;

      const currentShifts = shifts[dateKey]?.shifts || [];
      const newShifts = currentShifts.filter(s => s.id !== shiftToRemove.id);
      
      if (newShifts.length === 0 && !shifts[dateKey]?.note) {
        const newShiftsState = { ...shifts };
        delete newShiftsState[dateKey];
        setShifts(newShiftsState);
      } else {
        setShifts(prev => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            shifts: newShifts
          }
        }));
      }
    } catch (err) {
      setError('Error al eliminar el turno');
    }
  };

  const createCustomShift = async () => {
    try {
      if (!newCustomShift.name || !newCustomShift.startTime || !newCustomShift.endTime) {
        setError('Por favor, completa todos los campos');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: shift, error } = await supabase
        .from('nurse_custom_shifts')
        .insert([{
          nurse_id: user.id,
          name: newCustomShift.name,
          start_time: newCustomShift.startTime,
          end_time: newCustomShift.endTime,
          color: newCustomShift.color
        }])
        .select()
        .single();

      if (error) throw error;

      const newShift: Shift = {
        id: shift.id,
        name: shift.name,
        startTime: shift.start_time,
        endTime: shift.end_time,
        color: shift.color,
        icon: shift.name.charAt(0).toUpperCase(),
        duration: calculateDuration(shift.start_time, shift.end_time),
        isCustom: true
      };

      setCustomShifts(prev => [...prev, newShift]);
      setShowCustomShiftForm(false);
      setNewCustomShift({
        name: '',
        startTime: '',
        endTime: '',
        color: 'bg-gray-100'
      });
    } catch (err) {
      setError('Error al crear el turno personalizado');
    }
  };

  const updateNote = async (date: Date, note: string) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error: noteError } = await supabase
        .from('nurse_shifts')
        .update({ notes: note })
        .eq('date', dateKey)
        .eq('nurse_id', user.id);

      if (noteError) throw noteError;

      setShifts(prev => ({
        ...prev,
        [dateKey]: {
          date,
          shifts: prev[dateKey]?.shifts || [],
          note
        }
      }));
    } catch (err) {
      setError('Error al actualizar la nota');
    }
  };

  const handleShiftSelect = async (shift: Shift) => {
    if (!selectedDay) return;
    
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const dayAlreadyHas = shifts[dateKey]?.shifts?.length || 0;
    if (dayAlreadyHas >= 2) {
      setError('Solo puedes añadir hasta 2 turnos por día.');
      return;
    }

    try {
      await addShift(selectedDay, shift);
    } catch (err) {
      setError('Error al guardar el turno');
    }
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setNewCustomShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color
    });
    setShowCustomShiftForm(true);
    setShowCustomShiftEditor(false);
  };

  const handleUpdateShift = async () => {
    if (!editingShift) return;

    try {
      const { error: updateError } = await supabase
        .from('nurse_custom_shifts')
        .update({
          name: newCustomShift.name,
          start_time: newCustomShift.startTime,
          end_time: newCustomShift.endTime,
          color: newCustomShift.color
        })
        .eq('id', editingShift.id);

      if (updateError) throw updateError;

      // Update local state
      setCustomShifts(prev => prev.map(shift => 
        shift.id === editingShift.id
          ? {
              ...shift,
              name: newCustomShift.name,
              startTime: newCustomShift.startTime,
              endTime: newCustomShift.endTime,
              color: newCustomShift.color
            }
          : shift
      ));

      setEditingShift(null);
      setNewCustomShift({
        name: '',
        startTime: '',
        endTime: '',
        color: 'bg-gray-100'
      });
    } catch (err) {
      setError('Error al actualizar el turno');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('nurse_custom_shifts')
        .delete()
        .eq('id', shiftId);

      if (deleteError) throw deleteError;

      // Remove from calendar
      const updatedShifts: Record<string, DayShift> = {};
      Object.entries(shifts).forEach(([date, dayShift]) => {
        const filteredShifts = dayShift.shifts.filter(s => s.id !== shiftId);
        if (filteredShifts.length > 0 || dayShift.note) {
          updatedShifts[date] = {
            ...dayShift,
            shifts: filteredShifts
          };
        }
      });

      setShifts(updatedShifts);
      setCustomShifts(prev => prev.filter(s => s.id !== shiftId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Error al eliminar el turno');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="flex-none border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowCustomShiftEditor(true)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex-none p-4 bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7">
        {eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }).map(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayShifts = shifts[dateKey]?.shifts || [];
          const hasNote = Boolean(shifts[dateKey]?.note);

          return (
            <div
              key={dateKey}
              onClick={() => setSelectedDay(date)}
              className={`
                relative border-r border-b p-1
                ${!isSameMonth(date, currentDate) ? 'bg-gray-50' : ''}
                ${isToday(date) ? 'bg-blue-50' : ''}
                cursor-pointer hover:bg-gray-50 transition-colors
              `}
            >
              {/* Date Number */}
              <div className="text-right text-sm mb-1">
                {format(date, 'd')}
              </div>

              {/* Shifts Container */}
              <div className="absolute inset-x-1 top-7 bottom-1">
                {dayShifts.map((shift, index) => {
                  const totalShifts = dayShifts.length;
                  const shiftHeight = 100 / totalShifts;
                  const top = `${index * shiftHeight}%`;
                  const height = `${shiftHeight}%`;

                  return (
                    <div
                      key={`${dateKey}-${shift.id}-${index}`}
                      className={`
                        absolute left-0 right-0
                        ${shift.color} rounded-md
                        flex items-center justify-center
                        transition-all duration-200
                      `}
                      style={{ 
                        top,
                        height,
                        opacity: 0.9
                      }}
                    >
                      {shift.isCustom ? (
                        <span className="text-lg font-bold">
                          {shift.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        shift.icon
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Note Indicator */}
              {hasNote && (
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {format(selectedDay, "d 'de' MMMM, yyyy", { locale: es })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Shifts */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Turnos asignados:
                </h4>
                {shifts[format(selectedDay, 'yyyy-MM-dd')]?.shifts.map(shift => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${shift.color} p-2 rounded-full`}>
                        {shift.isCustom ? (
                          <span className="text-lg font-bold">
                            {shift.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          shift.icon
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{shift.name}</span>
                        <div className="text-sm text-gray-500">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeShift(selectedDay, shift)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Shift */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Añadir turno:
                  </h4>
                  <button
                    onClick={() => setShowCustomShiftForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Crear turno
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...PREDEFINED_SHIFTS, ...customShifts].map(shift => (
                    <button
                      key={shift.id}
                      onClick={() => handleShiftSelect(shift)}
                      className={`
                        ${shift.color} p-3 rounded-lg
                        flex flex-col items-center gap-1
                        hover:opacity-80 transition-opacity
                      `}
                    >
                      {shift.isCustom ? (
                        <span className="text-lg font-bold">
                          {shift.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        shift.icon
                      )}
                      <span className="text-xs font-medium">{shift.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Nota:</h4>
                <textarea
                  value={shifts[format(selectedDay, 'yyyy-MM-dd')]?.note || ''}
                  onChange={(e) => updateNote(selectedDay, e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm"
                  placeholder="Añade una nota para este día..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Shift Form */}
      {showCustomShiftForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingShift ? 'Editar Turno' : 'Crear Turno Personalizado'}
              </h3>
              <button
                onClick={() => {
                  setShowCustomShiftForm(false);
                  setEditingShift(null);
                  setNewCustomShift({
                    name: '',
                    startTime: '',
                    endTime: '',
                    color: 'bg-gray-100'
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del turno
                </label>
                <input
                  type="text"
                  value={newCustomShift.name}
                  onChange={(e) => setNewCustomShift(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ej: Turno especial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={newCustomShift.startTime}
                    onChange={(e) => setNewCustomShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={newCustomShift.endTime}
                    onChange={(e) => setNewCustomShift(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    'bg-red-100',
                    'bg-orange-100',
                    'bg-yellow-100',
                    'bg-green-100',
                    'bg-blue-100',
                    'bg-indigo-100',
                    'bg-purple-100',
                    'bg-pink-100'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCustomShift(prev => ({ ...prev, color }))}
                      className={`
                        w-8 h-8 rounded-full ${color}
                        ${newCustomShift.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      `}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCustomShiftForm(false);
                    setEditingShift(null);
                    setNewCustomShift({
                      name: '',
                      startTime: '',
                      endTime: '',
                      color: 'bg-gray-100'
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingShift ? handleUpdateShift : createCustomShift}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingShift ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Shift Editor */}
      {showCustomShiftEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Turnos Personalizados</h3>
              <button
                onClick={() => setShowCustomShiftEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Custom Shifts List */}
            <div className="space-y-4">
              {customShifts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No hay turnos personalizados
                </p>
              ) : (
                customShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${shift.color} p-2 rounded-full`}>
                        <span className="text-lg font-bold">
                          {shift.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{shift.name}</span>
                        <div className="text-sm text-gray-500">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(shift.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => {
                  setEditingShift(null);
                  setShowCustomShiftForm(true);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Crear Nuevo Turno</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Seguro que quieres eliminar este turno? Si está asignado en el calendario,
              desaparecerá de todas las fechas donde se ha usado.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm) {
                    handleDeleteShift(showDeleteConfirm);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShiftManagement;