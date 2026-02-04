import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, CalendarCheck, CalendarX, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const AvailabilityCalendar = ({ providerId, bookings = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth, currentYear]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/availability/${providerId}?month=${monthKey}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const toggleAvailability = async (date, currentlyAvailable) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: date,
          is_available: !currentlyAvailable,
          notes: currentlyAvailable ? 'Indisponible' : null
        }),
      });

      if (response.ok) {
        toast.success(currentlyAvailable ? 'Marqué indisponible' : 'Marqué disponible');
        fetchAvailability();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const isDateBlocked = (dateStr) => {
    const avail = availability.find(a => a.date === dateStr);
    return avail && !avail.is_available;
  };

  const getBookingForDate = (dateStr) => {
    return bookings.find(b => b.event_date === dateStr && (b.status === 'confirmed' || b.status === 'pending'));
  };

  const getDateStatus = (dateStr) => {
    const booking = getBookingForDate(dateStr);
    if (booking && booking.status === 'confirmed') return 'booked';
    if (booking && booking.status === 'pending') return 'pending';
    if (isDateBlocked(dateStr)) return 'unavailable';
    return 'available';
  };

  const isPastDate = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const formatDateStr = (day) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-14 md:h-18" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(day);
    const status = getDateStatus(dateStr);
    const isPast = isPastDate(day);
    const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
    const isSelected = selectedDate === dateStr;
    const booking = getBookingForDate(dateStr);

    // Color scheme: green (available), grey (unavailable), blue (booked)
    let bgClass = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300';
    let textClass = 'text-emerald-700';
    let statusIcon = null;
    let statusLabel = null;

    if (status === 'booked') {
      bgClass = 'bg-blue-100 hover:bg-blue-150 border-blue-400';
      textClass = 'text-blue-700';
      statusIcon = <CalendarCheck className="h-3.5 w-3.5" />;
      statusLabel = booking?.event_type?.substring(0, 8);
    } else if (status === 'pending') {
      bgClass = 'bg-amber-50 hover:bg-amber-100 border-amber-300';
      textClass = 'text-amber-700';
      statusIcon = <Calendar className="h-3.5 w-3.5" />;
      statusLabel = 'En attente';
    } else if (status === 'unavailable') {
      bgClass = 'bg-gray-100 hover:bg-gray-200 border-gray-300';
      textClass = 'text-gray-500';
      statusIcon = <Lock className="h-3 w-3" />;
    }

    if (isPast) {
      bgClass = 'bg-gray-50 border-gray-200';
      textClass = 'text-gray-300';
      statusIcon = null;
      statusLabel = null;
    }

    days.push(
      <button
        key={day}
        onClick={() => {
          if (!isPast) {
            setSelectedDate(isSelected ? null : dateStr);
          }
        }}
        disabled={isPast || loading}
        className={`
          h-14 md:h-18 rounded-lg border-2 transition-all relative
          ${bgClass} ${textClass}
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-md' : ''}
          ${isToday ? 'font-bold' : ''}
          ${isPast ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          flex flex-col items-center justify-center
        `}
        data-testid={`calendar-day-${day}`}
      >
        <span className={`text-sm md:text-base leading-none ${isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
          {day}
        </span>
        {statusIcon && (
          <span className="mt-0.5">{statusIcon}</span>
        )}
        {statusLabel && (
          <span className="text-[10px] leading-none mt-0.5 truncate max-w-full px-1">
            {statusLabel}
          </span>
        )}
      </button>
    );
  }

  // Stats for the month
  const unavailableCount = availability.filter(a => !a.is_available && a.date.startsWith(monthKey)).length;
  const confirmedCount = bookings.filter(b => 
    b.event_date.startsWith(monthKey) && b.status === 'confirmed'
  ).length;
  const pendingCount = bookings.filter(b => 
    b.event_date.startsWith(monthKey) && b.status === 'pending'
  ).length;

  // Get selected date info
  const selectedBooking = selectedDate ? getBookingForDate(selectedDate) : null;
  const selectedStatus = selectedDate ? getDateStatus(selectedDate) : null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-semibold" data-testid="calendar-title">
            Planning & Disponibilités
          </h2>
          <p className="text-sm text-muted-foreground">Gérez votre calendrier</p>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday} data-testid="today-btn">
          Aujourd'hui
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth} data-testid="prev-month-btn">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-semibold" data-testid="current-month">
          {MONTHS_FR[currentMonth]} {currentYear}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextMonth} data-testid="next-month-btn">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Legend - Updated color scheme */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-300" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300" />
          <span className="text-muted-foreground">Indisponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400" />
          <span className="text-muted-foreground">Réservé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-50 border-2 border-amber-300" />
          <span className="text-muted-foreground">En attente</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAYS_FR.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {days}
      </div>

      {/* Selected Date Panel */}
      {selectedDate && (
        <div className="p-4 bg-secondary/50 rounded-lg mb-4" data-testid="selected-date-actions">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
              
              {selectedStatus === 'booked' && selectedBooking && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="font-medium">Événement confirmé</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">{selectedBooking.event_type}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{selectedBooking.event_location}</p>
                </div>
              )}
              
              {selectedStatus === 'pending' && selectedBooking && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Demande en attente</span>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">{selectedBooking.event_type}</p>
                </div>
              )}
              
              {selectedStatus === 'unavailable' && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Marqué comme indisponible
                </p>
              )}
              
              {selectedStatus === 'available' && (
                <p className="text-sm text-emerald-600 mt-1">
                  ✓ Cette date est disponible
                </p>
              )}
            </div>
            
            {/* Actions - only show for available/unavailable dates */}
            {(selectedStatus === 'available' || selectedStatus === 'unavailable') && (
              <Button
                onClick={() => toggleAvailability(selectedDate, selectedStatus === 'available')}
                disabled={loading}
                variant={selectedStatus === 'unavailable' ? 'default' : 'secondary'}
                className="shrink-0"
                data-testid="toggle-availability-btn"
              >
                {selectedStatus === 'unavailable' ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Rendre disponible
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Marquer indisponible
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick tip when no date selected */}
      {!selectedDate && (
        <div className="p-4 border border-dashed border-border rounded-lg text-center">
          <CalendarX className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Cliquez sur une date pour voir les détails ou gérer vos disponibilités
          </p>
        </div>
      )}

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-center p-3 rounded-lg bg-gray-50">
          <p className="text-xl font-semibold text-gray-600" data-testid="unavailable-count">{unavailableCount}</p>
          <p className="text-xs text-muted-foreground">Indisponibles</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-50">
          <p className="text-xl font-semibold text-blue-600" data-testid="confirmed-count">{confirmedCount}</p>
          <p className="text-xs text-muted-foreground">Confirmés</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50">
          <p className="text-xl font-semibold text-amber-600" data-testid="pending-count">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
      </div>
    </Card>
  );
};

export default AvailabilityCalendar;
