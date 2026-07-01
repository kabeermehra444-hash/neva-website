// All NEVA events happen in Los Angeles, so admin-entered dates/times are
// always meant as Pacific wall-clock time. This converts that intended
// Pacific time into a correct UTC ISO string for storage, automatically
// handling the PST/PDT daylight saving switch (no hardcoded offset).

const NEVA_TIMEZONE = 'America/Los_Angeles';

function getTimezoneOffsetMinutes(timeZone, date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return (asUTC - date.getTime()) / 60000;
}

/**
 * Converts a date + time typed into a form (assumed to mean Pacific local
 * time) into a correct UTC ISO string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timeStr - "HH:MM" (24-hour)
 * @returns {string|null} UTC ISO string, or null if inputs are missing
 */
export function pacificWallTimeToUTCISOString(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // First guess: treat the wall-clock numbers as if they were UTC
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  // Find Pacific's actual offset at that moment (handles DST correctly)
  const offsetMinutes = getTimezoneOffsetMinutes(NEVA_TIMEZONE, utcGuess);
  // Shift the guess by that offset to get the real UTC instant
  const correctedMillis = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60000;
  return new Date(correctedMillis).toISOString();
}

/**
 * Formats a stored UTC timestamp for display, always in Pacific time
 * regardless of the viewer's device timezone.
 */
export function formatPacificDate(dt, options = {}) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-US', { ...options, timeZone: NEVA_TIMEZONE });
}

export function formatPacificTime(dt, options = {}) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
    timeZone: NEVA_TIMEZONE,
  });
}

export { NEVA_TIMEZONE };
