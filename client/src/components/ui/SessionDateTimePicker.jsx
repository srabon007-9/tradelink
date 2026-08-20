/**
 * components/ui/SessionDateTimePicker.jsx — Compact date & time picker
 *
 * Replaces the native <input type="datetime-local"> for booking a
 * session — its built-in scrolling hour/minute list is slow and fiddly
 * across browsers. This is a fast calendar grid + hour/minute/AM-PM
 * selector in a single popover. Nothing commits to the parent until
 * "Done" is pressed, so an accidental click can't silently change the
 * booking time.
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MINUTE_OPTIONS = [0, 15, 30, 45];

const pad = n => String(n).padStart(2, '0');

const toValueString = (year, month, day, hour24, minute) =>
  `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour24)}:${pad(minute)}`;

const parseValue = value => {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour24, minute] = (timePart || '00:00').split(':').map(Number);
  return { year, month: month - 1, day, hour24, minute };
};

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The default time (when nothing's selected yet) needs to already be >=
 * minDate, or "Done" would be wrongly disabled the instant someone picks
 * the earliest valid day without touching the time controls. Rounds up
 * to the next 15-minute slot, rolling into the next hour if needed.
 */
const defaultTimeFrom = date => {
  const roundedMinute = Math.ceil(date.getMinutes() / 15) * 15;
  if (roundedMinute >= 60) {
    return { hour24: (date.getHours() + 1) % 24, minute: 0 };
  }
  return { hour24: date.getHours(), minute: roundedMinute };
};

/**
 * @param {{ id?: string, value: string, onChange: (value: string) => void, minDate: Date }} props
 */
const SessionDateTimePicker = ({ id, value, onChange, minDate }) => {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const parsed = parseValue(value);
  const effectiveMin = minDate || new Date();
  const minDay = startOfDay(effectiveMin);
  const defaultTime = defaultTimeFrom(effectiveMin);

  const [viewYear, setViewYear] = useState(parsed ? parsed.year : effectiveMin.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.month : effectiveMin.getMonth());
  const [selectedDay, setSelectedDay] = useState(
    parsed ? { year: parsed.year, month: parsed.month, day: parsed.day } : null
  );
  const [hour24, setHour24] = useState(parsed ? parsed.hour24 : defaultTime.hour24);
  const [minute, setMinute] = useState(parsed ? parsed.minute : defaultTime.minute);

  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hour12 = hour24 % 12 || 12;
  const isPM = hour24 >= 12;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const isDayDisabled = day => new Date(viewYear, viewMonth, day) < minDay;

  const selectDay = day => {
    if (isDayDisabled(day)) return;
    setSelectedDay({ year: viewYear, month: viewMonth, day });
  };

  const setHour12 = h12 => {
    setHour24(isPM ? (h12 % 12) + 12 : h12 % 12);
  };
  const toggleAmPm = () => {
    setHour24(prev => (prev >= 12 ? prev - 12 : prev + 12));
  };
  const stepHour = delta => {
    const nextH12 = ((hour12 - 1 + delta + 12) % 12) + 1;
    setHour12(nextH12);
  };
  const stepMinute = delta => {
    const idx = MINUTE_OPTIONS.indexOf(minute);
    const nextIdx = (idx + delta + MINUTE_OPTIONS.length) % MINUTE_OPTIONS.length;
    setMinute(MINUTE_OPTIONS[nextIdx]);
  };

  const selectedDateObj = selectedDay
    ? new Date(toValueString(selectedDay.year, selectedDay.month, selectedDay.day, hour24, minute))
    : null;
  const isPastMin = selectedDateObj && selectedDateObj < effectiveMin;
  const canConfirm = Boolean(selectedDay) && !isPastMin;

  const handleDone = () => {
    if (!canConfirm) return;
    onChange(toValueString(selectedDay.year, selectedDay.month, selectedDay.day, hour24, minute));
    setIsOpen(false);
  };

  const displayLabel = value
    ? new Date(`${value}:00`).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Select date & time';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(prev => !prev)}
        className="input-base flex items-center justify-between text-left"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? 'text-slate-900' : 'text-concrete-500'}>{displayLabel}</span>
        <span aria-hidden="true" className="text-steel-400">📅</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose session date and time"
          className="absolute z-30 mt-2 w-full min-w-[280px] rounded-md border border-concrete-200 bg-white p-3 shadow-card sm:w-[320px]"
        >
          {/* ── Calendar ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="rounded p-1.5 text-steel-600 hover:bg-concrete-50"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-slate-950">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="rounded p-1.5 text-steel-600 hover:bg-concrete-50"
            >
              ›
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-steel-400">
            {DAY_LABELS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const disabled = isDayDisabled(day);
              const isSelected =
                selectedDay &&
                selectedDay.year === viewYear &&
                selectedDay.month === viewMonth &&
                selectedDay.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-7 w-7 rounded-full text-xs transition-colors',
                    disabled && 'cursor-not-allowed text-concrete-300',
                    !disabled && !isSelected && 'text-slate-700 hover:bg-concrete-100',
                    isSelected && 'bg-navy-800 font-semibold text-white'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* ── Time ─────────────────────────────────────────────────── */}
          <div className="mt-3 flex items-center gap-2 border-t border-concrete-200 pt-3">
            <div className="flex items-center overflow-hidden rounded-md border border-concrete-300">
              <button
                type="button"
                onClick={() => stepHour(-1)}
                aria-label="Previous hour"
                className="px-2 py-1.5 text-steel-500 hover:bg-concrete-50"
              >
                −
              </button>
              <span aria-label="Hour" className="min-w-[2ch] px-1 text-center text-sm font-semibold text-slate-900">
                {hour12}
              </span>
              <button
                type="button"
                onClick={() => stepHour(1)}
                aria-label="Next hour"
                className="px-2 py-1.5 text-steel-500 hover:bg-concrete-50"
              >
                +
              </button>
            </div>
            <span className="text-steel-500">:</span>
            <div className="flex items-center overflow-hidden rounded-md border border-concrete-300">
              <button
                type="button"
                onClick={() => stepMinute(-1)}
                aria-label="Previous minute"
                className="px-2 py-1.5 text-steel-500 hover:bg-concrete-50"
              >
                −
              </button>
              <span aria-label="Minute" className="min-w-[2.5ch] px-1 text-center text-sm font-semibold text-slate-900">
                {pad(minute)}
              </span>
              <button
                type="button"
                onClick={() => stepMinute(1)}
                aria-label="Next minute"
                className="px-2 py-1.5 text-steel-500 hover:bg-concrete-50"
              >
                +
              </button>
            </div>
            <div className="ml-1 flex overflow-hidden rounded-md border border-concrete-300">
              <button
                type="button"
                onClick={() => isPM && toggleAmPm()}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-semibold',
                  !isPM ? 'bg-navy-800 text-white' : 'bg-white text-steel-600'
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => !isPM && toggleAmPm()}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-semibold',
                  isPM ? 'bg-navy-800 text-white' : 'bg-white text-steel-600'
                )}
              >
                PM
              </button>
            </div>
          </div>

          {isPastMin && (
            <p className="mt-2 text-xs text-red-600">Please choose a time at least 30 minutes from now.</p>
          )}

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="mt-3 flex justify-end gap-2 border-t border-concrete-200 pt-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-steel-600 hover:bg-concrete-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={!canConfirm}
              className="rounded-md bg-navy-800 px-4 py-1.5 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDateTimePicker;
