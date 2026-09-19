import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
} from 'react-icons/lu';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  caption?: string;
}

interface CalendarPosition {
  top: number;
  left: number;
  width: number;
}

const WEEK_DAYS = [
  'Пн',
  'Вт',
  'Ср',
  'Чт',
  'Пт',
  'Сб',
  'Вс',
];

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function parseDate(value: string) {
  if (!value) return null;

  const [year, month, day] =
    value.split('-').map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatValue(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string) {
  const date = parseDate(value);

  if (!date) return '';

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date);
}

function formatLongDate(value: string) {
  const date = parseDate(value);

  if (!date) return '';

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

function getMonthDays(
  year: number,
  month: number,
) {
  const firstDay = new Date(
    year,
    month,
    1,
  );

  const lastDay = new Date(
    year,
    month + 1,
    0,
  );

  let startDay = firstDay.getDay();

  startDay =
    startDay === 0 ? 6 : startDay - 1;

  const daysInMonth =
    lastDay.getDate();

  const previousMonthDays =
    new Date(
      year,
      month,
      0,
    ).getDate();

  const days = [];

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(
        year,
        month - 1,
        previousMonthDays - i,
      ),
      currentMonth: false,
    });
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push({
      date: new Date(
        year,
        month,
        day,
      ),
      currentMonth: true,
    });
  }

  const remaining =
    42 - days.length;

  for (
    let day = 1;
    day <= remaining;
    day++
  ) {
    days.push({
      date: new Date(
        year,
        month + 1,
        day,
      ),
      currentMonth: false,
    });
  }

  return days;
}

function isSameDay(
  first: Date | null,
  second: Date | null,
) {
  if (!first || !second) return false;

  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function isDateDisabled(
  date: Date,
  min?: string,
  max?: string,
) {
  const value = formatValue(date);

  if (min && value < min) return true;
  if (max && value > max) return true;

  return false;
}

function parseManualDate(
  value: string,
) {
  const digits = value.replace(
    /\D/g,
    '',
  );

  if (digits.length !== 8) {
    return null;
  }

  const day = Number(
    digits.slice(0, 2),
  );
  const month = Number(
    digits.slice(2, 4),
  );
  const year = Number(
    digits.slice(4, 8),
  );

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getManualValue(
  value: string,
) {
  const date = parseDate(value);

  return date
    ? formatDisplay(value)
    : '';
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  placeholder = 'Выберите дату',
  className = '',
  ariaLabel,
  caption = 'DEADLINE',
}: DatePickerProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [manualValue, setManualValue] =
    useState(
      getManualValue(value),
    );

  const selectedDate =
    parseDate(value);

  const today = new Date();

  const [viewDate, setViewDate] =
    useState(
      selectedDate ??
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
    );

  const [position, setPosition] =
    useState<CalendarPosition | null>(
      null,
    );

  const rootRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const calendarRef =
    useRef<HTMLDivElement>(null);

  const manualDate = parseManualDate(manualValue);
  const invalid = Boolean(manualValue) && (!manualDate || isDateDisabled(manualDate, min, max));
  useEffect(() => {
    inputRef.current?.setCustomValidity(invalid ? 'Укажите существующую дату в допустимом интервале.' : '');
  }, [invalid]);

  useEffect(() => {
    setManualValue(
      getManualValue(value),
    );

    const date = parseDate(value);

    if (date) {
      setViewDate(date);
    }
  }, [value]);

  const updatePosition = () => {
    if (!rootRef.current) return;

    const rect =
      rootRef.current.getBoundingClientRect();

    const width = Math.max(
      rect.width,
      300,
    );

    const gap = 6;
    const padding = 8;

    let left = rect.left;

    if (
      left + width >
      window.innerWidth - padding
    ) {
      left =
        window.innerWidth -
        width -
        padding;
    }

    left = Math.max(
      padding,
      left,
    );

    const calendarHeight =
      calendarRef.current
        ?.offsetHeight ?? 390;

    const spaceBelow =
      window.innerHeight -
      rect.bottom;

    const spaceAbove = rect.top;

    const openUp =
      spaceBelow <
        calendarHeight + gap &&
      spaceAbove > spaceBelow;

    let top = openUp
      ? rect.top -
        calendarHeight -
        gap
      : rect.bottom + gap;

    top = Math.max(
      padding,
      Math.min(
        top,
        window.innerHeight -
          calendarHeight -
          padding,
      ),
    );

    setPosition({
      top,
      left,
      width,
    });
  };

  const openCalendar = () => {
    if (disabled) return;

    setIsOpen(true);

    requestAnimationFrame(() => {
      updatePosition();
    });
  };

  const closeCalendar = () => {
    setIsOpen(false);
  };

  const selectDate = (
    date: Date,
  ) => {
    if (
      isDateDisabled(
        date,
        min,
        max,
      )
    ) {
      return;
    }

    const nextValue =
      formatValue(date);

    onChange(nextValue);
    setManualValue(
      formatDisplay(nextValue),
    );
    setViewDate(date);
    setIsOpen(false);
  };

  const changeMonth = (
    offset: number,
  ) => {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            offset,
          1,
        ),
    );
  };

  const handleManualChange = (
    nextValue: string,
  ) => {
    const digits = nextValue
      .replace(/\D/g, '')
      .slice(0, 8);

    let formatted = digits;

    if (digits.length > 2) {
      formatted =
        `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    if (digits.length > 4) {
      formatted =
        `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    }

    setManualValue(formatted);

    if (digits.length === 8) {
      const date =
        parseManualDate(formatted);

      if (
        date &&
        !isDateDisabled(
          date,
          min,
          max,
        )
      ) {
        const nextValue =
          formatValue(date);

        onChange(nextValue);
        setViewDate(date);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = () => {
      updatePosition();
    };

    const handleOutside = (
      event: MouseEvent | FocusEvent,
    ) => {
      const target =
        event.target as Node;

      const insideTrigger =
        rootRef.current?.contains(
          target,
        );

      const insideCalendar =
        calendarRef.current?.contains(
          target,
        );

      if (
        !insideTrigger &&
        !insideCalendar
      ) {
        closeCalendar();
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        closeCalendar();
        inputRef.current?.focus();
      }
    };

    requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener(
      'resize',
      handleResize,
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      true,
    );

    document.addEventListener(
      'mousedown',
      handleOutside,
    );
    document.addEventListener('focusin', handleOutside);

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      );

      window.removeEventListener(
        'scroll',
        handleScroll,
        true,
      );

      document.removeEventListener(
        'mousedown',
        handleOutside,
      );
      document.removeEventListener('focusin', handleOutside);

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const days = getMonthDays(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );

  const portalRoot =
    document.getElementById(
      'portal-root',
    );

  const calendar = (
    <div
      ref={calendarRef}
      className={`
        fixed
        overflow-hidden
        rounded-lg
        border
        border-line/60
        bg-void
        shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8)]
        transition-all
        duration-150
        ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'scale-95 opacity-0'
        }
      `}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width:
          position?.width ?? 300,
        maxWidth:
          'calc(100vw - 16px)',
        zIndex: 2147483647,
      }}
    >
      <div className="border-b border-line/50 bg-hull/20 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="mono-label text-[8px] text-fog/40">
              {caption}
            </div>

            <div className="mt-1 text-[13px] font-medium text-snow">
              {selectedDate
                ? formatLongDate(value)
                : 'Дата не выбрана'}
            </div>
          </div>

          <LuCalendarDays className="h-4 w-4 text-flux/70" />
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              changeMonth(-1)
            }
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line/50 text-fog transition-colors hover:border-flux/30 hover:bg-flux/5 hover:text-flux"
            aria-label="Предыдущий месяц"
          >
            <LuChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-center">
            <div className="text-[12px] font-semibold text-snow">
              {MONTHS[
                viewDate.getMonth()
              ]}
            </div>

            <div className="font-mono text-[9px] text-fog/45">
              {viewDate.getFullYear()}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              changeMonth(1)
            }
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line/50 text-fog transition-colors hover:border-flux/30 hover:bg-flux/5 hover:text-flux"
            aria-label="Следующий месяц"
          >
            <LuChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {WEEK_DAYS.map(
            (day) => (
              <div
                key={day}
                className="flex h-7 items-center justify-center font-mono text-[8px] uppercase text-fog/35"
              >
                {day}
              </div>
            ),
          )}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map(
            ({
              date,
              currentMonth,
            }) => {
              const dateValue =
                formatValue(date);

              const selected =
                isSameDay(
                  date,
                  selectedDate,
                );

              const todayDate =
                isSameDay(
                  date,
                  today,
                );

              const disabledDate =
                isDateDisabled(
                  date,
                  min,
                  max,
                );

              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={
                    disabledDate
                  }
                  onClick={() =>
                    selectDate(date)
                  }
                  className={`
                    relative
                    mx-auto
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-md
                    text-[11px]
                    transition-all
                    ${
                      !currentMonth
                        ? 'text-fog/15'
                        : disabledDate
                          ? 'cursor-not-allowed text-fog/15'
                          : selected
                            ? 'bg-flux text-void font-bold shadow-[0_0_16px_-5px_rgba(56,189,248,0.9)]'
                            : 'text-fog hover:bg-hull/70 hover:text-snow'
                    }
                  `}
                >
                  {date.getDate()}

                  {todayDate &&
                    !selected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-flux" />
                    )}

                  {selected && (
                    <LuCheck className="absolute right-0.5 top-0.5 h-2.5 w-2.5" />
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line/50 bg-hull/10 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => {
            const todayValue =
              formatValue(today);

            if (
              !isDateDisabled(
                today,
                min,
                max,
              )
            ) {
              selectDate(today);
            }
          }}
          className="font-mono text-[8px] uppercase tracking-wider text-fog/50 transition-colors hover:text-flux"
        >
          Сегодня
        </button>

        {selectedDate && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setManualValue('');
              setIsOpen(false);
            }}
            className="font-mono text-[8px] uppercase tracking-wider text-crit/60 transition-colors hover:text-crit"
          >
            Очистить
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={rootRef}
        className={`relative w-full ${className}`}
      >
        <div
          className={`
            flex
            min-h-[44px]
            w-full
            items-center
            gap-2.5
            rounded-md
            border
            bg-void/50
            px-3.5
            py-3
            transition-all
            duration-200
            ${
              isOpen
                ? 'border-flux/40 bg-flux/5 shadow-[0_0_16px_-6px_rgba(56,189,248,0.45)]'
                : 'border-line hover:border-line/80'
            }
            ${
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-text'
            }
          `}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
            }
          }}
        >
          <LuCalendarDays
            className={`
              h-4
              w-4
              shrink-0
              transition-colors
              ${
                isOpen || value
                  ? 'text-flux'
                  : 'text-fog/40'
              }
            `}
          />

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={manualValue}
            disabled={disabled}
            required={required}
            placeholder={
              value
                ? ''
                : placeholder
            }
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            onFocus={openCalendar}
            onChange={(event) =>
              handleManualChange(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                event.preventDefault();
                openCalendar();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] font-medium text-snow outline-none placeholder:text-fog/40"
          />

          {value && (
            <span className="hidden shrink-0 font-mono text-[8px] text-flux/60 sm:block">
              {caption}
            </span>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();

              if (isOpen) {
                closeCalendar();
              } else {
                openCalendar();
              }
            }}
            className="shrink-0 text-fog/40 transition-colors hover:text-flux disabled:cursor-not-allowed"
            aria-label="Открыть календарь"
          >
            <LuCalendarDays className="h-4 w-4" />
          </button>
        </div>

        {required && (
          <input
            tabIndex={-1}
            required
            value={value}
            onChange={() => {}}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen &&
        position &&
        portalRoot &&
        createPortal(
          calendar,
          portalRoot,
        )}
    </>
  );
}
