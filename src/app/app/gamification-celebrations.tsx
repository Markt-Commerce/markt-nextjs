'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { CelebrationOverlay, type Celebration } from '@/components/gamification/CelebrationOverlay';
import { fetchCelebrationFeedAction, markSeenAction } from './gamification/actions';

type AckBody = { badge_slugs?: string[]; tier?: boolean; streak?: boolean };
type Queued = Celebration & { ack: AckBody };

const POINTS_KEY = 'markt_gam_points';

function readBaseline(): number | null {
  try {
    const raw = window.localStorage.getItem(POINTS_KEY);
    return raw == null ? null : Number(raw);
  } catch {
    return null;
  }
}
function writeBaseline(v: number) {
  try {
    window.localStorage.setItem(POINTS_KEY, String(v));
  } catch {
    /* private mode — ignore */
  }
}

/**
 * Mounted once at the app root. Implements the REST "exactly once" loop (§13.10):
 * on open and on every return to foreground it drains the server's unseen
 * achievements, queues them one at a time, and acks each on dismissal (not on
 * enqueue — so an interrupted animation replays). Points have no socket here, so
 * a gain is surfaced as a toast by diffing lifetime_points against a stored
 * baseline (first load just sets the baseline — no "+5000" on day one).
 */
export function GamificationCelebrations() {
  const [current, setCurrent] = useState<Queued | null>(null);
  const queueRef = useRef<Queued[]>([]);
  const shownRef = useRef<Set<string>>(new Set());
  const busyRef = useRef(false);

  const pump = useCallback(() => {
    if (current || queueRef.current.length === 0) return;
    setCurrent(queueRef.current.shift() ?? null);
  }, [current]);

  const drain = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { lifetimePoints, unseen } = await fetchCelebrationFeedAction();

      // Points: toast the gain, but only once we have a prior baseline.
      if (lifetimePoints != null) {
        const baseline = readBaseline();
        if (baseline != null && lifetimePoints > baseline) {
          toast(`+${(lifetimePoints - baseline).toLocaleString('en-NG')} pts`, 'success');
        }
        writeBaseline(lifetimePoints);
      }

      const next: Queued[] = [];
      for (const b of unseen.badges ?? []) {
        const id = `badge:${b.slug}`;
        if (shownRef.current.has(id)) continue;
        next.push({ id, kind: 'badge', title: 'Badge unlocked!', body: b.name, ack: { badge_slugs: [b.slug] } });
      }
      if (unseen.tier_up) {
        const tier = unseen.tier_up.new_tier;
        const id = `tier:${tier}`;
        if (!shownRef.current.has(id)) {
          next.push({ id, kind: 'tier', title: 'Tier up!', body: `You’ve reached ${tier}.`, ack: { tier: true } });
        }
      }
      if (unseen.streak && unseen.streak.is_milestone) {
        const days = unseen.streak.streak_days ?? unseen.streak.days ?? 0;
        const id = `streak:${days}`;
        if (!shownRef.current.has(id)) {
          next.push({ id, kind: 'streak', title: `${days}-day streak!`, body: 'You’re on a roll — keep it going.', ack: { streak: true } });
        }
      }

      for (const c of next) shownRef.current.add(c.id);
      queueRef.current.push(...next);
      pump();
    } finally {
      busyRef.current = false;
    }
  }, [pump]);

  // Drain on mount and whenever the tab returns to the foreground.
  useEffect(() => {
    void drain();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void drain();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [drain]);

  // Advance the queue when the current one clears.
  useEffect(() => {
    if (!current) pump();
  }, [current, pump]);

  const dismiss = useCallback(() => {
    const done = current;
    setCurrent(null);
    if (done) void markSeenAction(done.ack); // ack on dismissal, not enqueue
  }, [current]);

  if (!current) return null;
  return <CelebrationOverlay celebration={current} onDismiss={dismiss} />;
}
