'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  parseSlideTransition,
  SLIDE_TRANSITIONS,
  SLIDE_TRANSITION_SPECS,
  type SlideTransition,
} from '@/lib/transitions';

export default function TransitionSettings({
  initialTransition,
}: {
  initialTransition: SlideTransition;
}) {
  const [transition, setTransition] = useState<SlideTransition>(
    initialTransition
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide_transition: transition }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { slide_transition: SlideTransition };
      setTransition(data.slide_transition);
      setMessage(
        `Saved. New decks and the projector now use ${SLIDE_TRANSITION_SPECS[data.slide_transition].label}.`
      );
    } catch {
      setMessage('Failed to save the transition setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Slide transition</CardTitle>
        <CardDescription>
          One style for the whole deck, applied identically in the generated
          PPTX and on the projector. Slides that opt out (flyer images) never
          carry a transition. Every download is generated fresh, so the change
          takes effect on the next one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="slide-transition"
          >
            Transition
          </label>
          <select
            id="slide-transition"
            className="w-44 rounded-lg border bg-muted px-3 py-2 text-sm"
            value={transition}
            onChange={(e) => setTransition(parseSlideTransition(e.target.value))}
            disabled={saving}
          >
            {SLIDE_TRANSITIONS.map((id) => (
              <option key={id} value={id}>
                {SLIDE_TRANSITION_SPECS[id].label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <p className="w-full text-sm text-muted-foreground">
          {SLIDE_TRANSITION_SPECS[transition].hint}
        </p>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
