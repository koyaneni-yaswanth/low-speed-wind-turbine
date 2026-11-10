export interface AnalyticsEventItem {
  id: string;
  event: string;
  path: string;
  timestamp: string;
  meta?: Record<string, string | number | boolean>;
}

const CONSENT_KEY = 'ps_analytics_consent';
const EVENTS_KEY = 'ps_analytics_events';

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'declined');
}

export function getTrackedEvents(): AnalyticsEventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEventItem[]) : [];
  } catch {
    return [];
  }
}

export function trackAnalyticsEvent(
  event: 'page_view' | 'calculator_used' | 'pilot_form_start' | 'pilot_form_submit' | 'resource_download' | 'contact_submit',
  path: string,
  meta?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const entry: AnalyticsEventItem = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    path,
    timestamp: new Date().toISOString(),
    meta,
  };

  try {
    const existing = getTrackedEvents();
    const updated = [entry, ...existing].slice(0, 150);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  } catch {
    // Non-fatal storage limit safeguard
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, path, meta }),
  }).catch(() => {});
}
