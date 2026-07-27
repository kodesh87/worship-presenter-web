import type Database from 'better-sqlite3';
import { getDb } from './db';
import {
  coerceImageUrls,
  isSafeImageUrl,
  parseImagesPayloadJson,
} from './images';
import type { SlidePlanMedia } from './slide-plan';

export type AnnouncementItem = {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
};

export type AnnouncementInput = {
  image_url: string;
  service_id?: number | null;
  sort_order?: number;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function announcementPathname(ref: string): string | null {
  const trimmed = ref.trim();
  // Relative hub upload paths (not valid absolute URLs).
  if (trimmed.startsWith('/')) {
    try {
      return decodeURIComponent(trimmed.split(/[?#]/, 1)[0]).replace(/\/+$/, '');
    } catch {
      return null;
    }
  }
  try {
    return decodeURIComponent(new URL(trimmed).pathname).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function isVideoUrl(ref: string): boolean {
  const path = announcementPathname(ref);
  return path ? VIDEO_EXT.test(path) : false;
}

/** True when URL is SSRF-safe, not video, and has an image pathname extension. */
export function isAnnouncementImageUrl(ref: string): boolean {
  if (!isSafeImageUrl(ref) || isVideoUrl(ref)) return false;
  const path = announcementPathname(ref);
  return !!path && IMAGE_EXT.test(path);
}

/** Validate a single announcement image URL; throws Error with message for API 400. */
export function assertAnnouncementImageUrl(ref: unknown): string {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new Error('image_url must be a non-empty string');
  }
  const url = ref.trim();
  if (!isSafeImageUrl(url)) {
    throw new Error(
      'image_url must be an http(s) URL or a local /api/uploads/... path'
    );
  }
  if (isVideoUrl(url)) {
    throw new Error('Video/MP4 URLs are not allowed');
  }
  if (!isAnnouncementImageUrl(url)) {
    throw new Error(
      'image_url must end with an image extension (.jpg, .jpeg, .png, .gif, or .webp)'
    );
  }
  return url;
}

function parseOptionalServiceId(
  value: unknown,
  label = 'service_id'
): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer or null`);
  }
  return value;
}

function parseOptionalSortOrder(
  value: unknown,
  fallback: number,
  label = 'sort_order'
): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  return value;
}

function rowToItem(row: {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
}): AnnouncementItem {
  return {
    id: row.id,
    image_url: row.image_url,
    service_id: row.service_id ?? null,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

export function listAnnouncementItems(): AnnouncementItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, image_url, service_id, sort_order, created_at
       FROM announcement_items
       ORDER BY sort_order ASC, id ASC`
    )
    .all() as AnnouncementItem[];
  return rows.map(rowToItem);
}

/** Resolved flyer URLs for service S: recurring ∪ one-offs for S, in list order. */
export function resolveAnnouncementUrls(serviceId: number): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT image_url
       FROM announcement_items
       WHERE service_id IS NULL OR service_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(serviceId) as { image_url: string }[];

  return rows
    .map((r) => r.image_url)
    .filter((url) => isSafeImageUrl(url) && !isVideoUrl(url));
}

/**
 * Prefer Announcement List; fall back to legacy images_payload when list is empty.
 */
export function resolveImagesForService(
  serviceId: number,
  imagesPayloadJson: string | null | undefined
): string[] {
  const fromList = resolveAnnouncementUrls(serviceId);
  if (fromList.length > 0) return fromList;

  return parseImagesPayloadJson(imagesPayloadJson).urls.filter(
    (url) => !isVideoUrl(url)
  );
}

/** Flyer list + optional sermon/family graphic URLs for the slide plan. */
export function resolveSlideMediaForService(
  serviceId: number,
  imagesPayloadJson: string | null | undefined
): SlidePlanMedia {
  const extras = parseImagesPayloadJson(imagesPayloadJson);
  return {
    flyers: resolveImagesForService(serviceId, imagesPayloadJson),
    sermonGraphicUrl: extras.sermonGraphicUrl,
    familyPhotoUrl: extras.familyPhotoUrl,
    youthPhotoUrl: extras.youthPhotoUrl,
  };
}

function nextSortOrder(db: Database.Database): number {
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM announcement_items`
    )
    .get() as { next_order: number };
  return row.next_order;
}

function assertServiceExists(
  serviceId: number,
  db: Database.Database = getDb()
) {
  const row = db
    .prepare('SELECT id FROM services WHERE id = ?')
    .get(serviceId) as { id: number } | undefined;
  if (!row) {
    throw new Error(`Service ${serviceId} not found`);
  }
}

export function addAnnouncementItem(input: AnnouncementInput): AnnouncementItem {
  const imageUrl = assertAnnouncementImageUrl(input.image_url);
  const serviceId = parseOptionalServiceId(input.service_id);

  if (serviceId !== null) {
    assertServiceExists(serviceId);
  }

  const db = getDb();
  const sortOrder = parseOptionalSortOrder(
    input.sort_order,
    nextSortOrder(db)
  );

  const result = db
    .prepare(
      `INSERT INTO announcement_items (image_url, service_id, sort_order)
       VALUES (?, ?, ?)`
    )
    .run(imageUrl, serviceId, sortOrder);

  const id = Number(result.lastInsertRowid);
  const row = db
    .prepare(
      `SELECT id, image_url, service_id, sort_order, created_at
       FROM announcement_items WHERE id = ?`
    )
    .get(id) as AnnouncementItem;

  return rowToItem(row);
}

/**
 * Replace one-off announcements for a service (idempotent webhook path).
 * Recurring items are untouched. Runs in a single transaction.
 */
export type WorshipAnnouncementInput = {
  image_url: string;
  is_recurring: boolean;
};

/** Validate worship-form announcement rows (`is_recurring` or `isOneOff`). */
export function coerceWorshipAnnouncements(
  raw: unknown
): WorshipAnnouncementInput[] {
  if (!Array.isArray(raw)) {
    throw new Error('announcements must be an array');
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`announcements[${index}] must be an object`);
    }
    const image_url = assertAnnouncementImageUrl(
      (item as { image_url?: unknown }).image_url
    );
    const oneOff = (item as { isOneOff?: unknown }).isOneOff;
    const recurring = (item as { is_recurring?: unknown }).is_recurring;
    const is_recurring =
      oneOff === true ? false : oneOff === false ? true : !!recurring;
    return { image_url, is_recurring };
  });
}

export type SyncWorshipAnnouncementsOptions = {
  /**
   * When true, allow desired master to become empty (delete all recurring rows).
   * Without this, an empty desired master keeps the existing global master and
   * only replaces this service's one-offs (decision 1b).
   */
  clearMaster?: boolean;
};

/**
 * Sync worship create/edit announcement list.
 * - Master (`service_id IS NULL`) is rewritten only when recurring URLs/order change.
 * - Empty desired master does not wipe global master unless `clearMaster: true`.
 * - One-offs for this service are always replaced.
 * - Interleaved sort_order follows the form list.
 *
 * Caller should run inside a transaction when bundling with a service upsert,
 * and must then pass that transaction's own `db` handle: writes issued on a
 * different connection would land outside the transaction and survive its
 * rollback. Defaults to the process singleton for standalone callers.
 */
export function syncWorshipAnnouncements(
  serviceId: number,
  items: WorshipAnnouncementInput[],
  options: SyncWorshipAnnouncementsOptions = {},
  db: Database.Database = getDb()
): void {
  assertServiceExists(serviceId, db);
  const clearMaster = options.clearMaster === true;

  let workingItems = items;
  let desiredMaster = workingItems
    .filter((i) => i.is_recurring)
    .map((i) => i.image_url);
  const currentMaster = db
    .prepare(
      `SELECT id, image_url FROM announcement_items
       WHERE service_id IS NULL
       ORDER BY sort_order, id`
    )
    .all() as { id: number; image_url: string }[];
  const currentMasterUrls = currentMaster.map((r) => r.image_url);

  // 1b: refuse wiping master to empty without explicit clearMaster
  if (
    desiredMaster.length === 0 &&
    currentMasterUrls.length > 0 &&
    !clearMaster
  ) {
    workingItems = [
      ...currentMasterUrls.map((image_url) => ({
        image_url,
        is_recurring: true as const,
      })),
      ...workingItems.filter((i) => !i.is_recurring),
    ];
    desiredMaster = currentMasterUrls;
  }

  const masterChanged =
    desiredMaster.length !== currentMasterUrls.length ||
    desiredMaster.some((url, i) => url !== currentMasterUrls[i]);

  db.prepare('DELETE FROM announcement_items WHERE service_id = ?').run(
    serviceId
  );

  const insert = db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, ?, ?)`
  );
  const updateSort = db.prepare(
    `UPDATE announcement_items SET sort_order = ? WHERE id = ?`
  );

  if (masterChanged) {
    db.prepare('DELETE FROM announcement_items WHERE service_id IS NULL').run();
    workingItems.forEach((item, index) => {
      insert.run(
        item.image_url,
        item.is_recurring ? null : serviceId,
        index
      );
    });
    return;
  }

  // Master URLs unchanged: retarget sort_order; insert one-offs at form positions.
  const masterIdsByUrl = new Map<string, number[]>();
  for (const row of currentMaster) {
    const list = masterIdsByUrl.get(row.image_url) || [];
    list.push(row.id);
    masterIdsByUrl.set(row.image_url, list);
  }

  workingItems.forEach((item, index) => {
    if (item.is_recurring) {
      const ids = masterIdsByUrl.get(item.image_url);
      const id = ids?.shift();
      if (id != null) updateSort.run(index, id);
    } else {
      insert.run(item.image_url, serviceId, index);
    }
  });
}

export function replaceOneOffAnnouncementsForService(
  serviceId: number,
  urls: unknown
): AnnouncementItem[] {
  if (urls === undefined || urls === null) return [];
  if (!Array.isArray(urls)) {
    throw new Error('announcements must be an array of image URLs');
  }

  assertServiceExists(serviceId);
  const normalized = urls.map((url) => assertAnnouncementImageUrl(url));

  const db = getDb();
  // Caller may already be inside a transaction (e.g. webhook upsert).
  db.prepare('DELETE FROM announcement_items WHERE service_id = ?').run(
    serviceId
  );
  const insert = db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, ?, ?)`
  );
  let order = nextSortOrder(db);
  for (const imageUrl of normalized) {
    insert.run(imageUrl, serviceId, order);
    order += 1;
  }

  return listAnnouncementItems().filter((i) => i.service_id === serviceId);
}

/** @deprecated Prefer replaceOneOffAnnouncementsForService for webhook idempotency. */
export function appendOneOffAnnouncements(
  serviceId: number,
  urls: unknown
): AnnouncementItem[] {
  return replaceOneOffAnnouncementsForService(serviceId, urls);
}

export function replaceAnnouncementItems(
  items: AnnouncementInput[]
): AnnouncementItem[] {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array');
  }

  const normalized = items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`items[${index}] must be an object`);
    }
    const imageUrl = assertAnnouncementImageUrl(item.image_url);
    const serviceId = parseOptionalServiceId(
      item.service_id,
      `items[${index}].service_id`
    );
    if (serviceId !== null) {
      assertServiceExists(serviceId);
    }
    const sortOrder = parseOptionalSortOrder(
      item.sort_order,
      index,
      `items[${index}].sort_order`
    );
    return { image_url: imageUrl, service_id: serviceId, sort_order: sortOrder };
  });

  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM announcement_items').run();
    const insert = db.prepare(
      `INSERT INTO announcement_items (image_url, service_id, sort_order)
       VALUES (?, ?, ?)`
    );
    for (const item of normalized) {
      insert.run(item.image_url, item.service_id, item.sort_order);
    }
  });
  tx();

  return listAnnouncementItems();
}

export function updateAnnouncementItem(
  id: number,
  patch: Partial<AnnouncementInput>
): AnnouncementItem {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id, image_url, service_id, sort_order, created_at
       FROM announcement_items WHERE id = ?`
    )
    .get(id) as AnnouncementItem | undefined;

  if (!existing) {
    throw new Error('Announcement not found');
  }

  const imageUrl =
    patch.image_url !== undefined
      ? assertAnnouncementImageUrl(patch.image_url)
      : existing.image_url;

  let serviceId = existing.service_id;
  if (Object.prototype.hasOwnProperty.call(patch, 'service_id')) {
    serviceId = parseOptionalServiceId(patch.service_id);
    if (serviceId !== null) {
      assertServiceExists(serviceId);
    }
  }

  const sortOrder = parseOptionalSortOrder(patch.sort_order, existing.sort_order);

  db.prepare(
    `UPDATE announcement_items
     SET image_url = ?, service_id = ?, sort_order = ?
     WHERE id = ?`
  ).run(imageUrl, serviceId, sortOrder, id);

  const row = db
    .prepare(
      `SELECT id, image_url, service_id, sort_order, created_at
       FROM announcement_items WHERE id = ?`
    )
    .get(id) as AnnouncementItem;

  return rowToItem(row);
}

export function deleteAnnouncementItem(id: number): boolean {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM announcement_items WHERE id = ?')
    .run(id);
  return result.changes > 0;
}
