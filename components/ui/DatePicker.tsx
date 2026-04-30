"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FieldSize = "sm" | "md";

const monthNames = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const dayNames = ["lu", "ma", "me", "je", "ve", "sa", "di"];

const sizes: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

/** Trigger + list panel — matches form Select / calendar (no native OS dropdown). */
const calendarSelectTrigger =
  "flex w-full items-center justify-between gap-1 rounded-xl border border-zinc-200 bg-white text-left font-medium text-zinc-900 shadow-none transition-colors hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

const calendarSelectList =
  "absolute z-[10001] mt-1 max-h-52 w-full min-w-0 list-none overflow-x-hidden overflow-y-auto rounded-xl border border-zinc-200 bg-white p-0 py-1 shadow-lg";

function SelectChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

const POPOVER_WIDTH = 300;
const POPOVER_EST_HEIGHT = 340;
const GAP = 8;
const VIEWPORT_PAD = 8;

function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLabel(value?: string, placeholder = "Choisir une date") {
  const date = parseISODate(value);
  if (!date) return placeholder;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBeforeDate(date: Date, min?: string) {
  const minDate = parseISODate(min);
  return !!minDate && date < minDate;
}

function isAfterDate(date: Date, max?: string) {
  const maxDate = parseISODate(max);
  return !!maxDate && date > maxDate;
}

/** Year bounds for the year dropdown; widened when min/max omit a bound (e.g. birth dates vs bookings). */
function getYearRange(min?: string, max?: string): { from: number; to: number } {
  const now = new Date();
  const defaultPast = now.getFullYear() - 120;
  const defaultFuture = now.getFullYear() + 10;
  let from = defaultPast;
  let to = defaultFuture;

  const minD = parseISODate(min);
  const maxD = parseISODate(max);
  if (minD) from = minD.getFullYear();
  if (maxD) to = maxD.getFullYear();

  if (from > to) [from, to] = [to, from];
  return { from, to };
}

/** First of month view, kept within min/max month when those bounds exist. */
function clampViewMonth(d: Date, min?: string, max?: string): Date {
  const t = new Date(d.getFullYear(), d.getMonth(), 1);
  const minD = parseISODate(min);
  const maxD = parseISODate(max);
  if (minD) {
    const minMonth = new Date(minD.getFullYear(), minD.getMonth(), 1);
    if (t < minMonth) return minMonth;
  }
  if (maxD) {
    const maxMonth = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    if (t > maxMonth) return maxMonth;
  }
  return t;
}

function computePopoverCoords(trigger: DOMRect) {
  let left = trigger.left;
  let top = trigger.bottom + GAP;

  if (left + POPOVER_WIDTH > window.innerWidth - VIEWPORT_PAD) {
    left = window.innerWidth - POPOVER_WIDTH - VIEWPORT_PAD;
  }
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

  if (top + POPOVER_EST_HEIGHT > window.innerHeight - VIEWPORT_PAD) {
    top = trigger.top - POPOVER_EST_HEIGHT - GAP;
  }
  if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;

  return { top, left };
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  size = "md",
  className = "",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: FieldSize;
  className?: string;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const selectedDate = parseISODate(value);
  const [open, setOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState<null | "month" | "year">(null);
  const [viewDate, setViewDate] = useState(() => clampViewMonth(selectedDate ?? new Date(), min, max));
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    setCoords(computePopoverCoords(el.getBoundingClientRect()));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) setOpenPicker(null);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const d = parseISODate(value);
    if (d) setViewDate(clampViewMonth(d, min, max));
  }, [value, min, max, open]);

  const years = useMemo(() => {
    const { from, to } = getYearRange(min, max);
    const list: number[] = [];
    for (let y = to; y >= from; y--) list.push(y);
    return list;
  }, [min, max]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    const mondayOffset = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }, [viewDate]);

  const moveMonth = (delta: number) => {
    setOpenPicker(null);
    setViewDate((current) =>
      clampViewMonth(new Date(current.getFullYear(), current.getMonth() + delta, 1), min, max),
    );
  };

  const setViewMonth = (monthIndex: number) => {
    setOpenPicker(null);
    setViewDate(clampViewMonth(new Date(viewDate.getFullYear(), monthIndex, 1), min, max));
  };

  const setViewYear = (year: number) => {
    setOpenPicker(null);
    setViewDate(clampViewMonth(new Date(year, viewDate.getMonth(), 1), min, max));
  };

  const chooseDate = (date: Date) => {
    if (isBeforeDate(date, min) || isAfterDate(date, max)) return;
    setOpenPicker(null);
    onChange(toISODate(date));
    setOpen(false);
  };

  const popover =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Calendrier"
        style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
        className="w-[18.5rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl sm:w-72"
      >
        <div className="mb-3 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Mois précédent"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 items-stretch justify-center gap-2">
            <div className="relative min-w-0 flex-1">
              <button
                type="button"
                id={`${fieldId}-month-trigger`}
                className={`${calendarSelectTrigger} ${sizes[size]} min-w-0 capitalize`}
                aria-haspopup="listbox"
                aria-expanded={openPicker === "month"}
                aria-controls={`${fieldId}-month-list`}
                onClick={() => setOpenPicker((p) => (p === "month" ? null : "month"))}
              >
                <span className="truncate">{monthNames[viewDate.getMonth()]}</span>
                <SelectChevron open={openPicker === "month"} />
              </button>
              {openPicker === "month" ? (
                <ul
                  id={`${fieldId}-month-list`}
                  role="listbox"
                  aria-labelledby={`${fieldId}-month-trigger`}
                  className={`${calendarSelectList} left-0 right-0`}
                >
                  {monthNames.map((name, i) => (
                    <li key={name} role="none" className="min-w-0">
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === viewDate.getMonth()}
                        className={`box-border block w-full min-w-0 max-w-full truncate px-3 py-2 text-left capitalize ${
                          i === viewDate.getMonth()
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-800 hover:bg-zinc-50"
                        } ${sizes[size]}`}
                        onClick={() => setViewMonth(i)}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="relative w-[4.75rem] shrink-0 sm:w-[5.25rem]">
              <button
                type="button"
                id={`${fieldId}-year-trigger`}
                className={`${calendarSelectTrigger} ${sizes[size]} tabular-nums`}
                aria-haspopup="listbox"
                aria-expanded={openPicker === "year"}
                aria-controls={`${fieldId}-year-list`}
                onClick={() => setOpenPicker((p) => (p === "year" ? null : "year"))}
              >
                <span>{viewDate.getFullYear()}</span>
                <SelectChevron open={openPicker === "year"} />
              </button>
              {openPicker === "year" ? (
                <ul
                  id={`${fieldId}-year-list`}
                  role="listbox"
                  aria-labelledby={`${fieldId}-year-trigger`}
                  className={`${calendarSelectList} right-0 min-w-full max-w-full`}
                >
                  {years.map((y) => (
                    <li key={y} role="none" className="min-w-0">
                      <button
                        type="button"
                        role="option"
                        aria-selected={y === viewDate.getFullYear()}
                        className={`box-border block min-w-0 w-full max-w-full truncate px-3 py-2 text-left tabular-nums ${
                          y === viewDate.getFullYear()
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-800 hover:bg-zinc-50"
                        } ${sizes[size]}`}
                        onClick={() => setViewYear(y)}
                      >
                        {y}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day) => (
            <div key={day} className="py-1 text-[11px] font-semibold uppercase text-zinc-400">
              {day}
            </div>
          ))}
          {days.map((date) => {
            const currentMonth = date.getMonth() === viewDate.getMonth();
            const selected = sameDay(date, selectedDate);
            const today = sameDay(date, new Date());
            const blocked = isBeforeDate(date, min) || isAfterDate(date, max);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={blocked}
                onClick={() => chooseDate(date)}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  selected
                    ? "bg-zinc-900 text-white"
                    : today
                      ? "bg-teal-50 text-teal-700"
                      : currentMonth
                        ? "text-zinc-800 hover:bg-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-50"
                } disabled:cursor-not-allowed disabled:text-zinc-200 disabled:hover:bg-transparent`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          if (selectedDate) setViewDate(clampViewMonth(selectedDate, min, max));
          else setViewDate(clampViewMonth(new Date(), min, max));
          const el = buttonRef.current;
          if (el) setCoords(computePopoverCoords(el.getBoundingClientRect()));
          setOpen(true);
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white text-left text-zinc-900 transition-colors duration-200 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${sizes[size]}`}
      >
        <span className={selectedDate ? "truncate" : "truncate text-zinc-400"}>
          {formatDateLabel(value, placeholder)}
        </span>
        <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25A1.5 1.5 0 0 1 3.75 18.75v-12A1.5 1.5 0 0 1 5.25 5.25Z" />
        </svg>
      </button>
      {popover}
    </div>
  );
}
