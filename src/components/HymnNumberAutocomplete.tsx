'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  coerceHymnIndexEntries,
  filterHymnIndex,
  formatHymnFieldDisplay,
  hymnFieldDisplayValue,
  mergeHymnIndexEntries,
  normalizeHymnFilterQuery,
  resolveHymnDraft,
  type HymnIndexEntry,
} from '@/lib/worship-form-fields';

type DropdownPos = { top: number; left: number; width: number };

/** Debounce before hitting `GET /api/hymns` while the operator types. */
const SEARCH_DEBOUNCE_MS = 180;
/** Matches `filterHymnIndex`'s default limit and the route's cap. */
const SEARCH_LIMIT = 40;

/* ------------------------------------------------------------------------- *
 * Module-level lookup state.
 *
 * Every autocomplete on the page shares one cache and one in-flight map, so a
 * Parse hydrate costs one batched `numbers=` request instead of four, and a
 * query already typed into one field is free in the next. Plain `Map`s on
 * purpose: the repo forbids new global state libraries, and a client module's
 * top level is per-tab (never shared across requests the way a server module
 * would be).
 * ------------------------------------------------------------------------- */

/** Settled `/api/hymns` responses, keyed by query string. Failures are not cached. */
const queryCache = new Map<string, HymnIndexEntry[]>();
/** In-flight `/api/hymns` requests, so concurrent callers share one round trip. */
const queryInflight = new Map<string, Promise<HymnIndexEntry[] | null>>();
/** Every row ever fetched, by number — the `numbers=` fast path. */
const knownByNumber = new Map<number, HymnIndexEntry>();

function searchKey(query: string): string {
  return `q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`;
}

/** Rows for an already-settled query, or `null` when nothing has settled yet. */
function readSettledHymns(search: string): HymnIndexEntry[] | null {
  return queryCache.get(search) ?? null;
}

/** One `/api/hymns` round trip. `null` means the request failed. */
async function fetchHymns(search: string): Promise<HymnIndexEntry[] | null> {
  try {
    const res = await fetch(`/api/hymns?${search}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const rows = coerceHymnIndexEntries(await res.json());
    queryCache.set(search, rows);
    for (const row of rows) knownByNumber.set(row.number, row);
    return rows;
  } catch {
    // Non-blocking: the input stays usable and already-known hymns remain
    // selectable. Failures are not cached, so typing retries.
    return null;
  }
}

/** Cache- and in-flight-deduped `/api/hymns` request. */
function requestHymns(search: string): Promise<HymnIndexEntry[] | null> {
  const cached = queryCache.get(search);
  if (cached) return Promise.resolve(cached);
  const inflight = queryInflight.get(search);
  if (inflight) return inflight;
  const run = fetchHymns(search).finally(() => {
    queryInflight.delete(search);
  });
  queryInflight.set(search, run);
  return run;
}

/** Numbers waiting for the next coalesced `numbers=` request. */
let numberQueue: number[] = [];
let numberBatch: Promise<HymnIndexEntry[] | null> | null = null;
let settleNumberBatch: ((rows: HymnIndexEntry[] | null) => void) | null = null;

async function flushNumberQueue(): Promise<void> {
  const numbers = numberQueue;
  const settle = settleNumberBatch;
  numberQueue = [];
  numberBatch = null;
  settleNumberBatch = null;
  const rows = numbers.length
    ? await requestHymns(`numbers=${numbers.join(',')}`)
    : [];
  settle?.(rows);
}

/**
 * Resolve labels for stored hymn numbers. Requests raised in the same tick —
 * the four hymn fields re-rendering after a Parse hydrate — are coalesced into
 * a single `numbers=1,2,3,4` call, which is what that endpoint is for.
 */
function requestHymnNumber(number: number): Promise<HymnIndexEntry[] | null> {
  const known = knownByNumber.get(number);
  if (known) return Promise.resolve([known]);
  if (!numberBatch) {
    numberBatch = new Promise((resolve) => {
      settleNumberBatch = resolve;
    });
    setTimeout(() => void flushNumberQueue(), 0);
  }
  if (!numberQueue.includes(number)) numberQueue.push(number);
  return numberBatch;
}

/** Blur-time hymn commits that have not settled yet. */
const pendingCommits = new Set<Promise<void>>();

function trackCommit(promise: Promise<void>): void {
  const tracked = promise.catch(() => undefined);
  pendingCommits.add(tracked);
  void tracked.finally(() => {
    pendingCommits.delete(tracked);
  });
}

/**
 * Await every hymn commit still in flight.
 *
 * Clicking Save blurs the focused hymn input on `mousedown`, i.e. strictly
 * before the `click` that runs the save handler. The blur handler registers its
 * commit here synchronously, so by the time a save handler starts, any pending
 * commit is already in this set. Awaiting it — and then reading form state from
 * a ref rather than the click closure — is what stops a click from outrunning
 * the operator's typed hymn.
 */
export async function flushPendingHymnCommits(): Promise<void> {
  // A settling commit cannot enqueue another; the loop is purely defensive.
  for (let guard = 0; guard < 5 && pendingCommits.size > 0; guard += 1) {
    await Promise.all([...pendingCommits]);
  }
}

/**
 * `hymnIndex` is a *seed*, not the whole hymnal: the server embeds only the
 * hymns the form's initial values reference. Everything else is fetched on
 * demand and merged into a local lookup so picked/seen hymns keep their label.
 */
export function HymnNumberAutocomplete({
  value,
  onChange,
  hymnIndex,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  hymnIndex: HymnIndexEntry[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  /** Hymns learned this session: fetched search hits + user picks. */
  const [learned, setLearned] = useState<HymnIndexEntry[]>([]);
  /** Scoped to the query it describes, so a stale status never leaks. */
  const [searchState, setSearchState] = useState<{
    query: string;
    status: 'done' | 'failed';
  } | null>(null);
  /** A blur-time lookup failed: the draft was kept instead of guessed at. */
  const [lookupFailed, setLookupFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Bumped whenever the draft changes, so a late commit cannot overwrite it. */
  const commitSeqRef = useRef(0);
  const lastValueRef = useRef(value);

  const entries = useMemo(
    () => mergeHymnIndexEntries(hymnIndex, learned),
    [hymnIndex, learned]
  );

  const resolvedDisplay = useMemo(
    () => hymnFieldDisplayValue(value, entries),
    [value, entries]
  );
  /** Non-null only when `value` actually resolved to a `number - title` label. */
  const labelForValue = resolvedDisplay === value ? null : resolvedDisplay;
  const inputValue = draft !== null ? draft : resolvedDisplay;

  const results = useMemo(
    () => filterHymnIndex(entries, inputValue),
    [entries, inputValue]
  );

  const showList = open && inputValue.trim().length > 0;
  const canPortal = typeof document !== 'undefined';

  const learn = useCallback((rows: readonly HymnIndexEntry[]) => {
    if (rows.length === 0) return;
    setLearned((prev) => {
      // Fresh rows first so a title corrected in the database replaces the
      // stale one; bail out only when the merge is truly identical, otherwise
      // a same-length merge would pin the old title for the component's life.
      const next = mergeHymnIndexEntries(rows, prev);
      const unchanged =
        next.length === prev.length &&
        next.every(
          (entry, i) =>
            entry.number === prev[i].number && entry.title === prev[i].title
        );
      return unchanged ? prev : next;
    });
  }, []);

  // Debounced search while the dropdown is open. A field already showing its
  // resolved `number - title` label needs no round trip — otherwise tabbing
  // through four resolved fields fired four full-text searches.
  useEffect(() => {
    const query = normalizeHymnFilterQuery(inputValue);
    if (!open || !query || inputValue === labelForValue) return;
    let active = true;
    const timer = setTimeout(() => {
      void requestHymns(searchKey(query)).then((rows) => {
        if (!active) return;
        setSearchState({ query, status: rows === null ? 'failed' : 'done' });
        if (rows) learn(rows);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue, open, learn, labelForValue]);

  // Resolve the label for a stored number the seed does not cover (e.g. after
  // a Parse hydrate on the create page). Seeded numbers never reach here, so
  // an existing service still paints its labels with no client fetch.
  useEffect(() => {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return;
    if (entries.some((h) => String(h.number) === trimmed)) return;
    const number = Number.parseInt(trimmed, 10);
    if (!Number.isSafeInteger(number)) return;
    let active = true;
    void requestHymnNumber(number).then((rows) => {
      if (active && rows) learn(rows);
    });
    return () => {
      active = false;
    };
  }, [value, entries, learn]);

  useLayoutEffect(() => {
    if (!showList || !inputRef.current) {
      setPos(null);
      return;
    }
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + 4,
        left: r.left,
        width: r.width,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showList, inputValue]);

  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showList]);

  // When parent value changes externally (Parse hydrate) while not editing,
  // drop the draft. Keyed on an actual value change so a draft kept alive by a
  // failed lookup survives the blur that discovered the failure.
  useEffect(() => {
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    if (!focused) setDraft(null);
  }, [value, focused]);

  /** Invalidate any in-flight commit: the operator has moved on. */
  const supersedeCommit = () => {
    commitSeqRef.current += 1;
    setLookupFailed(false);
  };

  const settleCommit = (
    token: number,
    raw: string,
    fetched: HymnIndexEntry[] | null
  ) => {
    // A newer draft (retype, refocus, pick) already won — never clobber it.
    if (token !== commitSeqRef.current) return;
    if (fetched) learn(fetched);
    const settled = resolveHymnDraft({ draft: raw, value, entries, fetched });
    if (settled.kind !== 'commit') {
      // Lookup failed: keep the typed draft and say so. Never clear the field
      // and never treat the seed's lone local match as "unique".
      setLookupFailed(true);
      return;
    }
    onChange(settled.value);
    setDraft(null);
  };

  /**
   * Settle a blurred draft. Resolves synchronously whenever the answer is
   * already known (number, `12 - Title`, or a title query whose search has
   * settled), so React re-renders inside the blur before a Save click is
   * dispatched. Only a genuinely unknown title goes async, and that promise is
   * registered with `flushPendingHymnCommits` so Save waits for it.
   */
  const commitDraft = (raw: string) => {
    supersedeCommit();
    const token = commitSeqRef.current;
    const shape = resolveHymnDraft({ draft: raw, value, entries });
    if (shape.kind === 'commit') {
      onChange(shape.value);
      setDraft(null);
      return;
    }
    // `keep` needs a lookup result, which this call did not pass — unreachable.
    if (shape.kind !== 'lookup') return;
    const key = searchKey(shape.query);
    const settled = readSettledHymns(key);
    if (settled) {
      settleCommit(token, raw, settled);
      return;
    }
    trackCommit(
      requestHymns(key).then((rows) => {
        settleCommit(token, raw, rows);
      })
    );
  };

  const activeQuery = normalizeHymnFilterQuery(inputValue);
  // Default to "searching": the debounce window plus the round trip is time in
  // which nothing has settled yet, and reporting a definitive negative there
  // is a lie (on the create page it was every single search).
  const emptyMessage =
    searchState?.query !== activeQuery
      ? 'Searching hymns…'
      : searchState.status === 'failed'
        ? 'Hymn search unavailable'
        : 'No hymns found';

  const dropdown =
    canPortal &&
    showList &&
    pos &&
    createPortal(
      <div
        ref={listRef}
        className="fixed z-[100] max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-popover shadow-md ring-1 ring-foreground/10"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        {results.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic text-center py-3 px-2">
            {emptyMessage}
          </p>
        ) : (
          results.map((hymn) => (
            <button
              key={hymn.number}
              type="button"
              className="w-full flex justify-between items-center gap-2 px-2.5 py-1.5 text-left text-[11px] hover:bg-muted text-foreground"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                supersedeCommit();
                learn([hymn]);
                onChange(String(hymn.number));
                setDraft(null);
                setOpen(false);
              }}
            >
              <span className="font-semibold shrink-0">
                {formatHymnFieldDisplay(hymn.number, hymn.title)}
              </span>
            </button>
          ))
        )}
      </div>,
      document.body
    );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full p-2.5 text-xs bg-background border border-border/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
        value={inputValue}
        onChange={(e) => {
          const next = e.target.value;
          supersedeCommit();
          setDraft(next);
          setOpen(true);
          const t = next.trim();
          const dash = t.match(/^(\d+)\s*[-–—]/);
          if (dash) onChange(dash[1]);
          else if (/^\d+$/.test(t)) onChange(t);
          else if (!t) onChange('');
        }}
        onFocus={() => {
          supersedeCommit();
          setFocused(true);
          setDraft(resolvedDisplay);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setOpen(false);
          if (draft !== null) commitDraft(draft);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {lookupFailed && (
        <p
          role="status"
          aria-live="polite"
          className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"
        >
          Hymn lookup unavailable — your text was kept, nothing was changed.
        </p>
      )}
      {dropdown}
    </div>
  );
}
