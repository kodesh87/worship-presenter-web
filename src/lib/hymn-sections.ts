import type { ParsedItem } from './parser';

export type HymnItem = Extract<ParsedItem, { type: 'hymn' }>;

export type HymnBuckets = {
  bibleTalkHymns: HymnItem[];
  divineServiceHymns: HymnItem[];
  /** True when BIBLE TALK / DIVINE SERVICE markers were absent — positional slice used. */
  usedFallback: boolean;
};

function isBibleTalkSection(title: string): boolean {
  return /^BIBLE\s+TALK\b/i.test(title);
}

function isDivineServiceSection(title: string): boolean {
  return /^DIVINE\s+SERVICE\b/i.test(title);
}

/**
 * Bucket hymns by BIBLE TALK / DIVINE SERVICE section membership.
 * Falls back to hymns.slice(0,2) / slice(2) when those markers are missing.
 */
export function bucketHymnsBySection(items: ParsedItem[]): HymnBuckets {
  const list = Array.isArray(items) ? items : [];
  const allHymns = list.filter((i): i is HymnItem => i.type === 'hymn');

  const hasBibleTalk = list.some(
    (i) => i.type === 'section' && isBibleTalkSection(i.title)
  );
  const hasDivineService = list.some(
    (i) => i.type === 'section' && isDivineServiceSection(i.title)
  );

  if (!hasBibleTalk && !hasDivineService) {
    return {
      bibleTalkHymns: allHymns.slice(0, 2),
      divineServiceHymns: allHymns.slice(2),
      usedFallback: true,
    };
  }

  let section: 'bt' | 'ds' | null = null;
  const bibleTalkHymns: HymnItem[] = [];
  const divineServiceHymns: HymnItem[] = [];

  for (const item of list) {
    if (item.type === 'section') {
      if (isBibleTalkSection(item.title)) {
        section = 'bt';
      } else if (isDivineServiceSection(item.title)) {
        section = 'ds';
      } else {
        section = null;
      }
      continue;
    }
    if (item.type !== 'hymn') continue;
    if (section === 'bt') bibleTalkHymns.push(item);
    else if (section === 'ds') divineServiceHymns.push(item);
  }

  return { bibleTalkHymns, divineServiceHymns, usedFallback: false };
}
