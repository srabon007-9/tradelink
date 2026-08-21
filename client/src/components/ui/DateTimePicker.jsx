import React, { useState, useEffect, useRef } from 'react';

/**
 * Custom DateTimePicker Component matching TradeLink UI design
 * Features:
 * - Calendar Grid with Month/Year Navigation
 * - Custom Hour, Minute & AM/PM Selectors
 * - Disable past dates
 * - Floating Popover with backdrop / click-outside handling
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDisplayDateTime = (isoValue) => {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (isNaN(date.getTime())) return isoValue;

  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${month} ${day}, ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export default function DateTimePicker({
  value,
  onChange,
  min,
  id,
  placeholder = 'Select date & time',
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date from value or fallback to today/min
  const getInitialState = () => {
    let date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime())) {
      date = min ? new Date(min) : new Date();
    }
    
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return {
      viewYear: date.getFullYear(),
      viewMonth: date.getMonth(),
      selectedDay: date.getDate(),
      hour: hour12,
      minute: date.getMinutes(),
      ampm: ampm
    };
  };

  const [state, setState] = useState(getInitialState);

  // Sync state when value changes from outside
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;

        setState(prev => ({
          ...prev,
          viewYear: date.getFullYear(),
          viewMonth: date.getMonth(),
          selectedDay: date.getDate(),
          hour: hour12,
          minute: date.getMinutes(),
          ampm: ampm
        }));
      }
    }
  }, [value]);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Minimum date checking
  const minDate = min ? new Date(min) : null;
  if (minDate) {
    minDate.setHours(0, 0, 0, 0);
  }

  // Month navigation
  const handlePrevMonth = (e) => {
    e.preventDefault();
    setState(prev => {
      let newMonth = prev.viewMonth - 1;
      let newYear = prev.viewYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      return { ...prev, viewMonth: newMonth, viewYear: newYear };
    });
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setState(prev => {
      let newMonth = prev.viewMonth + 1;
      let newYear = prev.viewYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      return { ...prev, viewMonth: newMonth, viewYear: newYear };
    });
  };

  // Calendar calculations
  const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(state.viewYear, state.viewMonth, 1).getDay();

  const isDayDisabled = (day) => {
    if (!minDate) return false;
    const currentCellDate = new Date(state.viewYear, state.viewMonth, day, 23, 59, 59, 999);
    return currentCellDate < minDate;
  };

  const isDaySelected = (day) => {
    if (!value && !state.selectedDay) return false;
    return (
      state.selectedDay === day &&
      state.viewMonth === (value ? new Date(value).getMonth() : state.viewMonth) &&
      state.viewYear === (value ? new Date(value).getFullYear() : state.viewYear)
    );
  };

  // Time handlers
  const handleHourChange = (delta) => {
    setState(prev => {
      let h = prev.hour + delta;
      if (h > 12) h = 1;
      if (h < 1) h = 12;
      return { ...prev, hour: h };
    });
  };

  const handleMinuteChange = (delta) => {
    setState(prev => {
      let m = prev.minute + delta;
      if (m > 59) m = 0;
      if (m < 0) m = 59;
      return { ...prev, minute: m };
    });
  };

  const handleDone = () => {
    // Construct ISO string YYYY-MM-DDTHH:mm
    let h24 = state.hour;
    if (state.ampm === 'PM' && h24 < 12) h24 += 12;
    if (state.ampm === 'AM' && h24 === 12) h24 = 0;

    const pad = (n) => n.toString().padStart(2, '0');

    const yearStr = state.viewYear;
    const monthStr = pad(state.viewMonth + 1);
    const dayStr = pad(state.selectedDay || 1);
    const hourStr = pad(h24);
    const minStr = pad(state.minute);

    const isoString = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}`;
    if (onChange) {
      onChange(isoString);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Input Trigger */}
      <div
        className="relative cursor-pointer"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          id={id}
          type="text"
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          value={formatDisplayDateTime(value)}
          className={`w-full cursor-pointer rounded-lg border border-steel-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-navy-900 placeholder-steel-400 transition-all focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 disabled:cursor-not-allowed disabled:bg-concrete-100 ${className}`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-steel-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[330px] rounded-2xl border border-concrete-200 bg-white p-4 shadow-2xl transition-all">
          {/* Calendar Header: Month & Year */}
          <div className="mb-4 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-steel-600 hover:bg-concrete-100 hover:text-navy-900 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-bold text-navy-900">
              {MONTH_NAMES[state.viewMonth]} {state.viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-steel-600 hover:bg-concrete-100 hover:text-navy-900 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-steel-500">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {/* Empty slots before 1st day of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const disabledDay = isDayDisabled(day);
              const selected = isDaySelected(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => setState(prev => ({ ...prev, selectedDay: day }))}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all ${
                    selected
                      ? 'bg-navy-900 font-semibold text-white shadow-md'
                      : disabledDay
                      ? 'cursor-not-allowed text-steel-300'
                      : 'text-navy-800 hover:bg-concrete-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-concrete-200" />

          {/* Time Picker Controls */}
          <div className="flex items-center justify-between px-1">
            {/* Hour & Minute Pickers */}
            <div className="flex items-center gap-1.5">
              {/* Hour Box */}
              <div className="flex items-center gap-1 rounded-lg border border-concrete-300 bg-white px-2 py-1">
                <button
                  type="button"
                  onClick={() => handleHourChange(-1)}
                  className="text-steel-500 hover:text-navy-900 font-bold px-1 text-xs"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-navy-900 text-sm">
                  {state.hour}
                </span>
                <button
                  type="button"
                  onClick={() => handleHourChange(1)}
                  className="text-steel-500 hover:text-navy-900 font-bold px-1 text-xs"
                >
                  +
                </button>
              </div>

              <span className="font-bold text-navy-900">:</span>

              {/* Minute Box */}
              <div className="flex items-center gap-1 rounded-lg border border-concrete-300 bg-white px-2 py-1">
                <button
                  type="button"
                  onClick={() => handleMinuteChange(-1)}
                  className="text-steel-500 hover:text-navy-900 font-bold px-1 text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-navy-900 text-sm">
                  {state.minute.toString().padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => handleMinuteChange(1)}
                  className="text-steel-500 hover:text-navy-900 font-bold px-1 text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* AM / PM Segment Toggle */}
            <div className="flex items-center rounded-lg border border-concrete-300 bg-concrete-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, ampm: 'AM' }))}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  state.ampm === 'AM'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-steel-600 hover:text-navy-900'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, ampm: 'PM' }))}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  state.ampm === 'PM'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-steel-600 hover:text-navy-900'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="mt-5 flex items-center justify-end gap-3 px-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-steel-600 hover:text-navy-900 transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="rounded-xl bg-navy-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-navy-800 shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
