const QUIET_START = 21; // 21:00
const QUIET_END = 8; // 08:00

function getLocalParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = fmt.formatToParts(date).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimezoneOffset(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = fmt.formatToParts(date).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asUTC = Date.parse(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`
  );
  return (asUTC - date.getTime()) / 60000;
}

function zonedTimeToUtc(parts: any, tz: string) {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const date = new Date(utc);
  const offset = getTimezoneOffset(date, tz);
  return new Date(utc - offset * 60000);
}

export function isQuietHour(datetime: Date | string, tz: string): boolean {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const { hour } = getLocalParts(date, tz);
  return hour >= QUIET_START || hour < QUIET_END;
}

export function suggestNextAllowedTime(
  tz: string,
  from: Date | string = new Date()
): string {
  const date = typeof from === 'string' ? new Date(from) : from;
  const parts = getLocalParts(date, tz);
  if (!isQuietHour(date, tz)) {
    return date.toISOString();
  }
  if (parts.hour >= QUIET_START) {
    // tomorrow at QUIET_END
    const tomorrow = { ...parts, day: parts.day + 1, hour: QUIET_END, minute: 0, second: 0 };
    return zonedTimeToUtc(tomorrow, tz).toISOString();
  } else {
    // today at QUIET_END
    const next = { ...parts, hour: QUIET_END, minute: 0, second: 0 };
    return zonedTimeToUtc(next, tz).toISOString();
  }
}

import { Company } from './models/index.js';

export async function getPolicyStatus(company_id: string, channel: string) {
  const company = await Company.findOne({ company_id }).lean();
  if (!company) {
    throw new Error('company not found');
  }
  const tz = (company.locales && company.locales[0]) || 'Europe/Stockholm';
  const now = new Date();
  const reasons: string[] = [];
  const allowed = !isQuietHour(now, tz);
  let suggested_time: string | undefined;
  if (!allowed) {
    reasons.push('quiet_hours');
    suggested_time = suggestNextAllowedTime(tz, now);
  }
  return { allowed, reasons, suggested_time };
}
