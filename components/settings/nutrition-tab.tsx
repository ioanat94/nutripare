'use client';

import type {
  NutritionRule,
  NutritionSettings,
  ThresholdColor,
} from '@/types/firestore';
import { GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { getNutritionSettings, saveNutritionSettings } from '@/lib/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ROWS, SCORE_ROW } from '@/components/nutrition-table';
import { Switch } from '@/components/ui/switch';
import { getDefaultRules } from '@/utils/thresholds';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';

type DraftRule = Omit<NutritionRule, 'value'> & { value: number | undefined; id: string };

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
    visibleRows: [...ROWS.map((r) => r.key), SCORE_ROW.key],
    showCrown: true,
    showFlag: true,
    rules: getDefaultRules(),
    rowOrder: [...ROWS.map((r) => r.key), SCORE_ROW.key],
  };
}

function settingsEqual(a: NutritionSettings, b: NutritionSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface SortableNutrientRowProps {
  rowKey: string;
  label: string;
  checked: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

function SortableNutrientRow({ rowKey, label, checked, onToggle }: SortableNutrientRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rowKey });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className='flex items-center gap-2'>
      <button
        {...attributes}
        {...listeners}
        aria-label='Drag to reorder'
        className='cursor-grab text-muted-foreground active:cursor-grabbing'
        data-testid='nutrient-drag-handle'
      >
        <GripVertical className='size-4' />
      </button>
      <label className='flex cursor-pointer items-center gap-2 text-sm'>
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onToggle(rowKey, !!c)}
        />
        {label}
      </label>
    </div>
  );
}

interface SortableRuleRowProps {
  rule: DraftRule;
  index: number;
  error: string | undefined;
  showError: boolean;
  onUpdate: (index: number, field: keyof NutritionRule, value: string | number | undefined) => void;
  onRemove: (index: number) => void;
}

function SortableRuleRow({ rule, index, error, showError, onUpdate, onRemove }: SortableRuleRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div className='flex flex-wrap items-center gap-2'>
        <button
          {...attributes}
          {...listeners}
          aria-label='Drag to reorder'
          className='cursor-grab text-muted-foreground active:cursor-grabbing'
          data-testid='rule-drag-handle'
        >
          <GripVertical className='size-4' />
        </button>

        <Select
          value={rule.nutrient}
          onValueChange={(v) => v && onUpdate(index, 'nutrient', v)}
        >
          <SelectTrigger className='w-40'>
            <span className='flex flex-1 text-left'>
              {[...ROWS, SCORE_ROW].find((r) => r.key === rule.nutrient)?.label ?? rule.nutrient}
            </span>
          </SelectTrigger>
          <SelectContent className='min-w-0' alignItemWithTrigger={false}>
            {ROWS.map((row) => (
              <SelectItem key={row.key} value={row.key}>
                {row.label}
              </SelectItem>
            ))}
            <SelectItem key={SCORE_ROW.key} value={SCORE_ROW.key}>
              {SCORE_ROW.label}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={rule.direction}
          onValueChange={(v) => v && onUpdate(index, 'direction', v as 'above' | 'below')}
        >
          <SelectTrigger className='w-24'>
            <span className='flex flex-1 text-left'>{rule.direction}</span>
          </SelectTrigger>
          <SelectContent className='min-w-0' alignItemWithTrigger={false}>
            {DIRECTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className='text-sm text-muted-foreground'>or equal to</span>

        <input
          type='number'
          min={0}
          max={99.9}
          step={0.1}
          value={rule.value ?? ''}
          onChange={(e) => {
            if (e.target.value === '') {
              onUpdate(index, 'value', undefined);
              return;
            }
            const raw = parseFloat(e.target.value);
            if (!isNaN(raw)) {
              const clamped = Math.min(99.9, Math.max(0, parseFloat(raw.toFixed(1))));
              onUpdate(index, 'value', clamped);
            }
          }}
          className='h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
        />

        <span className='text-sm text-muted-foreground'>is</span>

        <Select
          value={rule.rating}
          onValueChange={(v) => v && onUpdate(index, 'rating', v as ThresholdColor)}
        >
          <SelectTrigger className='w-32'>
            <span className='flex flex-1 items-center gap-2 text-left'>
              {(() => {
                const opt = RATING_OPTIONS.find((o) => o.value === rule.rating);
                return opt ? (
                  <>
                    <span className={`inline-block size-2 shrink-0 rounded-full ${opt.colorClass}`} />
                    {opt.label}
                  </>
                ) : (
                  rule.rating
                );
              })()}
            </span>
          </SelectTrigger>
          <SelectContent className='min-w-0' alignItemWithTrigger={false}>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className='flex w-full items-center gap-2'>
                  <span className={`inline-block size-2 shrink-0 rounded-full ${opt.colorClass}`} />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant='ghost'
          size='icon'
          onClick={() => onRemove(index)}
          aria-label='Remove rule'
          className='hover:text-destructive'
        >
          <Trash2 className='size-4' />
        </Button>
      </div>
      {showError && error && (
        <p className='mt-1 text-xs text-destructive'>{error}</p>
      )}
    </div>
  );
}

export function NutritionTab({ userId }: NutritionTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<NutritionSettings | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const [visibleRows, setVisibleRows] = useState<string[]>([]);
  const [showCrown, setShowCrown] = useState(true);
  const [showFlag, setShowFlag] = useState(true);
  const [rules, setRules] = useState<DraftRule[]>([]);
  const [rowOrder, setRowOrder] = useState<string[]>([...ROWS.map((r) => r.key), SCORE_ROW.key]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    getNutritionSettings(userId).then((fetched) => {
      const s = fetched ?? buildDefault();
      const normalizedRowOrder = s.rowOrder ?? [...ROWS.map((r) => r.key), SCORE_ROW.key];
      setSaved({
        ...s,
        rules: s.rules.map((r) => ({ nutrient: r.nutrient, direction: r.direction, value: r.value, rating: r.rating })),
        rowOrder: normalizedRowOrder,
      });
      setVisibleRows(s.visibleRows);
      setShowCrown(s.showCrown);
      setShowFlag(s.showFlag);
      setRules(s.rules.map((r, i) => ({ ...r, id: `rule-${i}` })));
      setRowOrder(normalizedRowOrder);
      setLoading(false);
    });
  }, [userId]);

  const current: NutritionSettings = {
    visibleRows,
    showCrown,
    showFlag,
    rules: rules.map((r) => ({ nutrient: r.nutrient, direction: r.direction, value: r.value!, rating: r.rating })),
    rowOrder,
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
        const allRows = [...ROWS, SCORE_ROW];
        const nutrientLabel = allRows.find((r) => r.key === rule.nutrient)?.label ?? rule.nutrient;
        const ratingLabel = RATING_OPTIONS.find((o) => o.value === rule.rating)?.label ?? rule.rating;
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
    setVisibleRows((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
  }

  function updateRule(index: number, field: keyof NutritionRule, value: string | number | undefined) {
    setSaveAttempted(false);
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
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
        id: crypto.randomUUID(),
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNutrientDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRowOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleRuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRules((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
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
    return <Loader2 className='size-5 animate-spin text-muted-foreground' />;
  }

  return (
    <div className='space-y-8'>
      {/* Visible rows */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Visible rows</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNutrientDragEnd}>
          <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
            <div className='space-y-2'>
              {rowOrder.map((key) => {
                const allRows = [...ROWS, SCORE_ROW];
                const row = allRows.find((r) => r.key === key);
                if (!row) return null;
                return (
                  <SortableNutrientRow
                    key={key}
                    rowKey={key}
                    label={row.label}
                    checked={visibleRows.includes(key)}
                    onToggle={toggleNutrient}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      {/* Highlights */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Highlights</h3>
        <div className='space-y-4'>
          <div className='flex items-center gap-4'>
            <Switch checked={showCrown} onCheckedChange={(v) => setShowCrown(v)} />
            <div>
              <p className='text-sm font-medium'>Show crown (👑)</p>
              <p className='text-xs text-muted-foreground'>
                Marks the top result for nutrients with a &apos;Great&apos; rule.
              </p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Switch checked={showFlag} onCheckedChange={(v) => setShowFlag(v)} />
            <div>
              <p className='text-sm font-medium'>Show flag (🚩)</p>
              <p className='text-xs text-muted-foreground'>
                Marks the worst result for nutrients with a &apos;Bad&apos; rule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Rules</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRuleDragEnd}>
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className='space-y-2'>
              {rules.map((rule, i) => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  index={i}
                  error={validationErrors[i]}
                  showError={saveAttempted}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={addRule}>
            <Plus className='size-4' />
            Add rule
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRules(getDefaultRules().map((r, i) => ({ ...r, id: `rule-reset-${i}` })))}
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
