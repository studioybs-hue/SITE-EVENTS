import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          notes: currentlyAvailable ? 'Bloqué manuellement' : null
        }),
      });

      if (response.ok) {
        toast.success(currentlyAvailable ? 'Date bloquée' : 'Date débloquée');
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
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
  };

  const isDateBlocked = (dateStr) => {
    const avail = availability.find(a => a.date === dateStr);
    return avail && !avail.is_available;
  };

  const isDateBooked = (dateStr) => {
    return bookings.some(b => b.event_date === dateStr && b.status !== 'cancelled');
  };

  const getDateStatus = (dateStr) => {
    if (isDateBooked(dateStr)) return 'booked';
    if (isDateBlocked(dateStr)) return 'blocked';
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
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 md:h-16" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(day);
    const status = getDateStatus(dateStr);
    const isPast = isPastDate(day);
    const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
    const isSelected = selectedDate === dateStr;

    let bgClass = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200';
    let textClass = 'text-emerald-700';
    let icon = null;

    if (status === 'booked') {
      bgClass = 'bg-blue-100 border-blue-300';
      textClass = 'text-blue-700';
      icon = <CalendarX className="h-3 w-3" />;
    } else if (status === 'blocked') {
      bgClass = 'bg-rose-50 hover:bg-rose-100 border-rose-200';
      textClass = 'text-rose-600';
      icon = <Lock className="h-3 w-3" />;
    }

    if (isPast) {
      bgClass = 'bg-gray-50 border-gray-200';
      textClass = 'text-gray-400';
      icon = null;
    }

    days.push(
      <button
        key={day}
        onClick={() => {
          if (!isPast && status !== 'booked') {
            setSelectedDate(isSelected ? null : dateStr);
          }
        }}
        disabled={isPast || loading}
        className={`
          h-12 md:h-16 rounded-lg border transition-all relative
          ${bgClass} ${textClass}
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${isToday ? 'font-bold' : ''}
          ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}
          flex flex-col items-center justify-center gap-0.5
        `}
        data-testid={`calendar-day-${day}`}
      >
        <span className={`text-sm md:text-base ${isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
          {day}
        </span>
        {icon && <span className="absolute bottom-1 right-1">{icon}</span>}
      </button>
    );
  }

  // Stats
  const blockedCount = availability.filter(a => !a.is_available).length;
  const bookedCount = bookings.filter(b => 
    b.event_date.startsWith(monthKey) && b.status !== 'cancelled'
  ).length;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-semibold" data-testid="calendar-title">
            Calendrier
          </h2>
          <p className="text-sm text-muted-foreground">Gérez vos disponibilités</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200" />
          <span>Bloqué</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span>Réservé</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_FR.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days}
      </div>

      {/* Selected Date Actions */}
      {selectedDate && (
        <div className="p-4 bg-secondary/50 rounded-lg mb-6" data-testid="selected-date-actions">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {isDateBlocked(selectedDate) ? 'Cette date est bloquée' : 'Cette date est disponible'}
              </p>
            </div>
            <Button
              onClick={() => toggleAvailability(selectedDate, !isDateBlocked(selectedDate))}
              disabled={loading}
              variant={isDateBlocked(selectedDate) ? 'default' : 'destructive'}
              data-testid="toggle-availability-btn"
            >
              {isDateBlocked(selectedDate) ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Débloquer
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Bloquer
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Quick Block Action */}
      {!selectedDate && (
        <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
          <CalendarX className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Cliquez sur une date pour la bloquer ou la débloquer</p>
        </div>
      )}

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-semibold text-rose-600" data-testid="blocked-count">{blockedCount}</p>
          <p className="text-sm text-muted-foreground">Jours bloqués</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-blue-600" data-testid="booked-count">{bookedCount}</p>
          <p className="text-sm text-muted-foreground">Réservations</p>
        </div>
      </div>
    </Card>
  );
};

export default AvailabilityCalendar;
