/**
 * Row → view-model derivations.
 *
 * `types/index.ts` holds view models, not row shapes — the schema must be able
 * to *produce* every UI type, and this file is where that derivation lives.
 * Keeping it in one module is what stops the same conversion being reinvented,
 * slightly differently, in five query files.
 */
import type { ResourceKind, UserProfile } from '@/types/index';

const KB = 1024;

/** 49152 → "48 KB". Matches the format the mock data established. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < KB * KB) return `${Math.round(bytes / KB)} KB`;
  return `${(bytes / (KB * KB)).toFixed(1)} MB`;
}

/** "2026-02-18T…" → "February 2026". */
export function formatJoinedDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });
}

/** "2026-02-18T…" → "February 18, 2026". */
export function formatFullDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-NG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** "2026-08-26T…" → "2 days ago". Comments render relative timestamps. */
export function formatRelative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return 'Just now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (seconds >= unitSeconds) {
      return rtf.format(-Math.floor(seconds / unitSeconds), unit);
    }
  }
  return rtf.format(-Math.floor(seconds / 60), 'minute');
}

/** duration_seconds → durationMinutes. The schema stores seconds; the UI wants minutes. */
export function toDurationMinutes(seconds: number | null): number {
  return Math.round((seconds ?? 0) / 60);
}

/**
 * profiles.role + profiles.is_alumni → UserProfile.role.
 *
 * The database has two booleans' worth of information; the UI has a
 * three-valued enum. 'admin' wins over alumni status.
 */
export function toProfileRole(
  role: string | null,
  isAlumni: boolean | null
): UserProfile['role'] {
  if (role === 'admin') return 'instructor';
  if (isAlumni) return 'alumni';
  return 'student';
}

/** enrollments → UserProfile.tier. Cohort outranks recordings. */
export function toTier(productSkus: readonly string[]): UserProfile['tier'] {
  return productSkus.includes('cohort') ? 'cohort' : 'recordings';
}

/** enrollments.expires_at → Enrollment.status. null means lifetime. */
export function toEnrollmentStatus(expiresAt: string | null): 'active' | 'expired' {
  if (!expiresAt) return 'active';
  return new Date(expiresAt).getTime() > Date.now() ? 'active' : 'expired';
}

const RESOURCE_KINDS: readonly ResourceKind[] = [
  'blueprint',
  'code',
  'slide',
  'dataset',
  'doc',
];

/**
 * resources.kind is `text` in Postgres but a closed union in the UI. Narrow it
 * rather than casting, so an unexpected value degrades to 'doc' instead of
 * silently breaking an icon lookup.
 */
export function toResourceKind(kind: string | null): ResourceKind {
  return RESOURCE_KINDS.includes(kind as ResourceKind)
    ? (kind as ResourceKind)
    : 'doc';
}
