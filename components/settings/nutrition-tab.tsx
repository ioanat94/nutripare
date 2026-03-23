'use client';

import type {
  NutritionRule,
  NutritionSettings,
  ThresholdColor,
} from '@/types/firestore';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { getNutritionSettings, saveNutritionSettings } from '@/lib/firestore';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ROWS } from '@/components/nutrition-table';
import { Switch } from '@/components/ui/switch';
import { getDefaultRules } from '@/utils/thresholds';
import { toast } from 'sonner';

type DraftRule = Omit<NutritionRule, 'value'> & { value: number | undefined };

interface NutritionTabProps {
  userId: string;
}

const RATING_OPTIONS: {
  value: ThresholdColor;
  label: string;
  colorClass: string;
}[] = [
  { value: 'positive', label: 'great', colorClass: 'bg-positive' },
  { value: 'info', label: 'good', colorClass: 'bg-info' },
  { value: 'warning', label: 'concerning', colorClass: 'bg-warning' },
  { value: 'negative', label: 'bad', colorClass: 'bg-destructive' },
];

const DIRECTION_OPTIONS: { value: 'above' | 'below'; label: string }[] = [
  { value: 'above', label: 'above' },
  { value: 'below', label: 'below' },
];

function buildDefault(): NutritionSettings {
  return {
    visibleNutrients: ROWS.map((r) => r.key),
    showCrown: true,
    showFlag: true,
    rules: getDefaultRules(),
  };
}

function settingsEqual(a: NutritionSettings, b: NutritionSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function NutritionTab({ userId }: NutritionTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<NutritionSettings | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const [visibleNutrients, setVisibleNutrients] = useState<string[]>([]);
  const [showCrown, setShowCrown] = useState(true);
  const [showFlag, setShowFlag] = useState(true);
  const [rules, setRules] = useState<DraftRule[]>([]);

  useEffect(() => {
    getNutritionSettings(userId).then((fetched) => {
      const s = fetched ?? buildDefault();
      setSaved(s);
      setVisibleNutrients(s.visibleNutrients);
      setShowCrown(s.showCrown);
      setShowFlag(s.showFlag);
      setRules(s.rules);
      setLoading(false);
    });
  }, [userId]);

  const current: NutritionSettings = {
    visibleNutrients,
    showCrown,
    showFlag,
    rules: rules.map((r) => ({ ...r, value: r.value! })),
  };
  const isDirty = saved !== null && !settingsEqual(current, saved);

  const validationErrors = useMemo<Record<number, string>>(() => {
    const errors: Record<number, string> = {};
    const seen = new Map<string, number>();
    rules.forEach((rule, i) => {
      if (rule.value === undefined) {
        errors[i] = 'Value is required';
        return;
      }
      const key = `${rule.nutrient}:${rule.rating}`;
      if (seen.has(key)) {
        const nutrientLabel =
          ROWS.find((r) => r.key === rule.nutrient)?.label ?? rule.nutrient;
        const ratingLabel =
          RATING_OPTIONS.find((o) => o.value === rule.rating)?.label ??
          rule.rating;
        const msg = `A rule for ${nutrientLabel} / ${ratingLabel} already exists`;
        errors[i] = msg;
        const firstIdx = seen.get(key)!;
        if (!errors[firstIdx]) errors[firstIdx] = msg;
      } else {
        seen.set(key, i);
      }
    });
    return errors;
  }, [rules]);

  const hasErrors = Object.keys(validationErrors).length > 0;
  const defaultRules = useMemo(() => getDefaultRules(), []);
  const resetDisabled =
    rules.length === defaultRules.length &&
    rules.every(
      (r, i) =>
        r.nutrient === defaultRules[i].nutrient &&
        r.direction === defaultRules[i].direction &&
        r.value === defaultRules[i].value &&
        r.rating === defaultRules[i].rating,
    );
  const saveDisabled = !isDirty || saving;

  function toggleNutrient(key: string, checked: boolean) {
    setVisibleNutrients((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );
  }

  function updateRule(
    index: number,
    field: keyof NutritionRule,
    value: string | number | undefined,
  ) {
    setSaveAttempted(false);
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function addRule() {
    setSaveAttempted(false);
    setRules((prev) => [
      ...prev,
      {
        nutrient: ROWS[0].key,
        direction: 'above' as const,
        value: undefined,
        rating: 'positive' as const,
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaveAttempted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      await saveNutritionSettings(userId, current);
      setSaved(current);
      toast.success('Nutrition settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='h-8 animate-pulse rounded-md bg-muted' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Visible nutrients */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Visible nutrients</h3>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {ROWS.map((row) => (
            <label
              key={row.key}
              className='flex cursor-pointer items-center gap-2 text-sm'
            >
              <Checkbox
                checked={visibleNutrients.includes(row.key)}
                onCheckedChange={(checked) =>
                  toggleNutrient(row.key, !!checked)
                }
              />
              {row.label}
            </label>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Highlights</h3>
        <div className='space-y-4'>
          <div className='flex items-center gap-4'>
            <Switch
              checked={showCrown}
              onCheckedChange={(v) => setShowCrown(v)}
            />
            <div>
              <p className='text-sm font-medium'>Show crown (👑)</p>
              <p className='text-xs text-muted-foreground'>
                Marks the top result for nutrients with a &apos;Great&apos;
                rule.
              </p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Switch
              checked={showFlag}
              onCheckedChange={(v) => setShowFlag(v)}
            />
            <div>
              <p className='text-sm font-medium'>Show flag (🚩)</p>
              <p className='text-xs text-muted-foreground'>
                Marks the worst result for nutrients with a &apos;Bad&apos;
                rule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Rules</h3>
        <div className='space-y-2'>
          {rules.map((rule, i) => (
            <div key={i}>
              <div className='flex flex-wrap items-center gap-2'>
                <Select
                  value={rule.nutrient}
                  onValueChange={(v) => v && updateRule(i, 'nutrient', v)}
                >
                  <SelectTrigger className='w-40'>
                    <span className='flex flex-1 text-left'>
                      {ROWS.find((r) => r.key === rule.nutrient)?.label ??
                        rule.nutrient}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    className='min-w-0'
                    alignItemWithTrigger={false}
                  >
                    {ROWS.map((row) => (
                      <SelectItem key={row.key} value={row.key}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={rule.direction}
                  onValueChange={(v) =>
                    v && updateRule(i, 'direction', v as 'above' | 'below')
                  }
                >
                  <SelectTrigger className='w-24'>
                    <span className='flex flex-1 text-left'>
                      {rule.direction}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    className='min-w-0'
                    alignItemWithTrigger={false}
                  >
                    {DIRECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className='text-sm text-muted-foreground'>
                  or equal to
                </span>

                <input
                  type='number'
                  min={0}
                  max={99.9}
                  step={0.1}
                  value={rule.value ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      updateRule(i, 'value', undefined);
                      return;
                    }
                    const raw = parseFloat(e.target.value);
                    if (!isNaN(raw)) {
                      const clamped = Math.min(
                        99.9,
                        Math.max(0, parseFloat(raw.toFixed(1))),
                      );
                      updateRule(i, 'value', clamped);
                    }
                  }}
                  className='h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                />

                <span className='text-sm text-muted-foreground'>is</span>

                <Select
                  value={rule.rating}
                  onValueChange={(v) =>
                    v && updateRule(i, 'rating', v as ThresholdColor)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <span className='flex flex-1 items-center gap-2 text-left'>
                      {(() => {
                        const opt = RATING_OPTIONS.find(
                          (o) => o.value === rule.rating,
                        );
                        return opt ? (
                          <>
                            <span
                              className={`inline-block size-2 shrink-0 rounded-full ${opt.colorClass}`}
                            />
                            {opt.label}
                          </>
                        ) : (
                          rule.rating
                        );
                      })()}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    className='min-w-0'
                    alignItemWithTrigger={false}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className='flex w-full items-center gap-2'>
                          <span
                            className={`inline-block size-2 shrink-0 rounded-full ${opt.colorClass}`}
                          />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeRule(i)}
                  aria-label='Remove rule'
                  className='hover:text-destructive'
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
              {saveAttempted && validationErrors[i] && (
                <p className='mt-1 text-xs text-destructive'>
                  {validationErrors[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={addRule}>
            <Plus className='size-4' />
            Add rule
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRules(getDefaultRules())}
            disabled={resetDisabled}
          >
            Reset to defaults
          </Button>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saveDisabled}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
