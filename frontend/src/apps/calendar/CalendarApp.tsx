import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, Edit3, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils';
import { generateId } from '@/utils';
import type { CalendarEvent } from '@/types';

interface CalendarAppProps {
  windowId: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const EVENT_COLORS = ['#AD8B73','#CEAB93','#E3CAA5','#27AE60','#C0392B','#F39C12','#9B59B6','#3498DB'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarApp({ windowId: _windowId }: CalendarAppProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const now = new Date();
    return [
      { id: '1', title: 'Team Meeting', description: 'Weekly sync', startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).getTime(), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0).getTime(), allDay: false, color: '#AD8B73', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '2', title: 'Project Deadline', description: 'AI OS v1.0 release', startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).getTime(), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).getTime(), allDay: true, color: '#C0392B', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '3', title: 'Lunch with Sarah', description: 'At the cafe', startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 30).getTime(), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 13, 30).getTime(), allDay: false, color: '#27AE60', createdAt: Date.now(), updatedAt: Date.now() },
    ];
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.startDate);
      return eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate();
    });
  };

  const openCreateForm = (date?: Date) => {
    const d = date || selectedDate;
    setFormTitle('');
    setFormDescription('');
    setFormDate(d.toISOString().split('T')[0]);
    setFormTime('09:00');
    setFormAllDay(false);
    setFormColor(EVENT_COLORS[0]);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const openEditForm = (event: CalendarEvent) => {
    const d = new Date(event.startDate);
    setFormTitle(event.title);
    setFormDescription(event.description);
    setFormDate(d.toISOString().split('T')[0]);
    setFormTime(d.toTimeString().slice(0, 5));
    setFormAllDay(event.allDay);
    setFormColor(event.color || EVENT_COLORS[0]);
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const saveEvent = () => {
    if (!formTitle.trim()) return;
    const [y, m, d] = formDate.split('-').map(Number);
    const [h, min] = formTime.split(':').map(Number);
    const startDate = formAllDay ? new Date(y, m - 1, d).getTime() : new Date(y, m - 1, d, h, min).getTime();
    const endDate = startDate + (formAllDay ? 86400000 : 3600000);

    if (editingEvent) {
      setEvents((prev) => prev.map((e) =>
        e.id === editingEvent.id ? { ...e, title: formTitle, description: formDescription, startDate, endDate, allDay: formAllDay, color: formColor, updatedAt: Date.now() } : e
      ));
    } else {
      const newEvent: CalendarEvent = {
        id: generateId(), title: formTitle, description: formDescription,
        startDate, endDate, allDay: formAllDay, color: formColor,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setShowEventForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setShowEventForm(false);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text">{MONTHS[month]} {year}</h2>
          <button className="px-3 py-1 text-xs font-medium bg-surface-active border border-border rounded-lg hover:bg-border transition-colors" onClick={goToday}>Today</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-active border border-border rounded-lg p-0.5">
            {(['month','week','day'] as const).map((v) => (
              <button key={v} className={cn('px-3 py-1 text-xs font-medium rounded-md transition-colors', view === v ? 'bg-primary text-text-inverse' : 'text-text-muted hover:bg-surface-hover')} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="p-1.5 rounded hover:bg-surface-hover transition-colors" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1.5 rounded hover:bg-surface-hover transition-colors" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg bg-primary text-text-inverse hover:bg-primary-light transition-colors" onClick={() => openCreateForm()}><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-text-muted uppercase">{d}</div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(auto-fill,minmax(0,1fr))]">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="border-b border-r border-border bg-surface-hover/50" />;
              const date = new Date(year, month, day);
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <div
                  key={day}
                  className={cn(
                    'border-b border-r border-border p-1 min-h-[80px] cursor-pointer transition-colors',
                    isSelected && 'bg-primary/5',
                    !isSelected && 'hover:bg-surface-hover'
                  )}
                  onClick={() => { setSelectedDate(date); }}
                  onDoubleClick={() => openCreateForm(date)}
                >
                  <div className={cn('w-6 h-6 flex items-center justify-center rounded-full text-xs', isToday && 'bg-primary text-text-inverse font-bold', !isToday && 'text-text')}>
                    {day}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        className="w-full text-left text-[10px] px-1 py-0.5 rounded truncate text-text-inverse"
                        style={{ backgroundColor: event.color || '#AD8B73' }}
                        onClick={(e) => { e.stopPropagation(); openEditForm(event); }}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-text-muted">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-72 border-l border-border bg-surface-hover flex flex-col">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-text">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <CalendarIcon className="w-8 h-8 mx-auto opacity-20 mb-2" />
                <p className="text-xs">No events</p>
              </div>
            ) : (
              getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="p-3 bg-surface border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                        <p className="text-sm font-medium text-text truncate">{event.title}</p>
                      </div>
                      {event.description && <p className="text-xs text-text-muted mt-1">{event.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.allDay ? 'All day' : `${new Date(event.startDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted" onClick={() => openEditForm(event)}><Edit3 className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded hover:bg-danger/10 transition-colors text-danger" onClick={() => deleteEvent(event.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showEventForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40" onClick={() => setShowEventForm(false)}>
          <div className="bg-surface border border-border rounded-xl shadow-window w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
              <button className="p-1 rounded hover:bg-surface-hover transition-colors" onClick={() => setShowEventForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="input" placeholder="Event title" autoFocus />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="input min-h-[60px]" placeholder="Description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input" />
                </div>
                {!formAllDay && (
                  <div>
                    <label className="label">Time</label>
                    <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="input" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allDay" checked={formAllDay} onChange={(e) => setFormAllDay(e.target.checked)} className="rounded" />
                <label htmlFor="allDay" className="text-sm text-text">All day event</label>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((color) => (
                    <button key={color} className={cn('w-6 h-6 rounded-full transition-transform', formColor === color && 'ring-2 ring-offset-2 ring-primary scale-110')} style={{ backgroundColor: color }} onClick={() => setFormColor(color)} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-secondary" onClick={() => setShowEventForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveEvent}>{editingEvent ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}