'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BUILTIN_RULESETS, ROWS, SCORE_ROW } from '@/utils/constants';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  NutritionRule,
  NutritionRuleset,
  NutritionSettings,
  ThresholdColor,
} from '@/types/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getNutritionSettings, saveNutritionSettings } from '@/lib/firestore';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import type { DragEndEvent } from '@dnd-kit/core';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/tailwind';
import { toast } from 'sonner';

const ALL_ROWS = [...ROWS, SCORE_ROW];

type DraftRule = Omit<NutritionRule, 'value'> & {
  value: number | undefined;
  id: string;
};

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
    visibleRows: ALL_ROWS.map((r) => r.key),
    showCrown: true,
    showFlag: true,
    rulesets: BUILTIN_RULESETS,
    rowOrder: ALL_ROWS.map((r) => r.key),
  };
}

function settingsEqual(a: NutritionSettings, b: NutritionSettings): boolean {
  return (
    JSON.stringify(a.visibleRows) === JSON.stringify(b.visibleRows) &&
    a.showCrown === b.showCrown &&
    a.showFlag === b.showFlag &&
    JSON.stringify(a.rowOrder) === JSON.stringify(b.rowOrder) &&
    JSON.stringify(a.rulesets) === JSON.stringify(b.rulesets)
  );
}

interface SortableNutrientRowProps {
  rowKey: string;
  label: string;
  checked: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

function SortableNutrientRow({
  rowKey,
  label,
  checked,
  onToggle,
}: SortableNutrientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowKey });
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

interface SortableRulesetRowProps {
  ruleset: NutritionRuleset;
  onView: (ruleset: NutritionRuleset) => void;
  onDelete: (id: string) => void;
}

function SortableRulesetRow({
  ruleset,
  onView,
  onDelete,
}: SortableRulesetRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ruleset.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center gap-2 py-1'
    >
      <button
        {...attributes}
        {...listeners}
        aria-label='Drag to reorder'
        className='cursor-grab text-muted-foreground active:cursor-grabbing'
        data-testid='ruleset-drag-handle'
      >
        <GripVertical className='size-4' />
      </button>
      <span className='flex-1 truncate text-sm'>{ruleset.name}</span>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onView(ruleset)}
        aria-label='View ruleset'
        className='hover:text-info hover:bg-info/10'
      >
        <Eye className='size-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onDelete(ruleset.id)}
        aria-label='Delete ruleset'
        className='hover:text-destructive'
      >
        <Trash2 className='size-4' />
      </Button>
    </div>
  );
}

interface SortableRuleRowProps {
  rule: DraftRule;
  index: number;
  error: string | undefined;
  showError: boolean;
  onUpdate: (
    index: number,
    field: keyof NutritionRule,
    value: string | number | undefined,
  ) => void;
  onRemove: (index: number) => void;
}

function SortableRuleRow({
  rule,
  index,
  error,
  showError,
  onUpdate,
  onRemove,
}: SortableRuleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const selectedRating = RATING_OPTIONS.find((o) => o.value === rule.rating);
  return (
    <div ref={setNodeRef} style={style}>
      <div className='flex min-w-max items-center gap-2'>
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
              {ALL_ROWS.find((r) => r.key === rule.nutrient)?.label ??
                rule.nutrient}
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
          onValueChange={(v) =>
            v && onUpdate(index, 'direction', v as 'above' | 'below')
          }
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
              const clamped = Math.min(
                99.9,
                Math.max(0, parseFloat(raw.toFixed(1))),
              );
              onUpdate(index, 'value', clamped);
            }
          }}
          className='h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
        />

        <span className='text-sm text-muted-foreground'>is</span>

        <Select
          value={rule.rating}
          onValueChange={(v) =>
            v && onUpdate(index, 'rating', v as ThresholdColor)
          }
        >
          <SelectTrigger className='w-32'>
            <span className='flex flex-1 items-center gap-2 text-left'>
              {selectedRating ? (
                <>
                  <span
                    className={cn(
                      'inline-block size-2 shrink-0 rounded-full',
                      selectedRating.colorClass,
                    )}
                  />
                  {selectedRating.label}
                </>
              ) : (
                rule.rating
              )}
            </span>
          </SelectTrigger>
          <SelectContent className='min-w-0' alignItemWithTrigger={false}>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className='flex w-full items-center gap-2'>
                  <span
                    className={cn(
                      'inline-block size-2 shrink-0 rounded-full',
                      opt.colorClass,
                    )}
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

  // List view state
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [visibleRows, setVisibleRows] = useState<string[]>([]);
  const [showCrown, setShowCrown] = useState(true);
  const [showFlag, setShowFlag] = useState(true);
  const [rulesets, setRulesets] = useState<NutritionRuleset[]>([]);
  const [rowOrder, setRowOrder] = useState<string[]>(
    ALL_ROWS.map((r) => r.key),
  );

  // Delete confirmation for list view
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rulesetSearch, setRulesetSearch] = useState('');

  // Detail view state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRules, setEditingRules] = useState<DraftRule[]>([]);
  const [isNewRuleset, setIsNewRuleset] = useState(false);
  const [detailSaveAttempted, setDetailSaveAttempted] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    getNutritionSettings(userId)
      .then((fetched) => {
        const s = fetched ?? buildDefault();
        const normalizedRowOrder = s.rowOrder ?? ALL_ROWS.map((r) => r.key);
        setSaved({ ...s, rowOrder: normalizedRowOrder });
        setVisibleRows(s.visibleRows);
        setShowCrown(s.showCrown);
        setShowFlag(s.showFlag);
        setRulesets(s.rulesets);
        setRowOrder(normalizedRowOrder);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load nutrition settings');
        setLoading(false);
      });
  }, [userId]);

  const isDirty = useMemo(
    () =>
      saved !== null &&
      !settingsEqual(
        { visibleRows, showCrown, showFlag, rulesets, rowOrder },
        saved,
      ),
    [visibleRows, showCrown, showFlag, rulesets, rowOrder, saved],
  );

  // Detail view validation
  const detailValidationErrors = useMemo<Record<number, string>>(() => {
    const errors: Record<number, string> = {};
    const seen = new Map<string, number>();
    editingRules.forEach((rule, i) => {
      if (rule.value === undefined) {
        errors[i] = 'Value is required';
        return;
      }
      const key = `${rule.nutrient}:${rule.rating}`;
      if (seen.has(key)) {
        const nutrientLabel =
          ALL_ROWS.find((r) => r.key === rule.nutrient)?.label ?? rule.nutrient;
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
  }, [editingRules]);

  function openDetail(ruleset: NutritionRuleset, isNew = false) {
    setEditingId(ruleset.id);
    setEditingName(ruleset.name);
    setEditingRules(ruleset.rules.map((r, i) => ({ ...r, id: `rule-${i}` })));
    setIsNewRuleset(isNew);
    setDetailSaveAttempted(false);
    setView('detail');
  }

  function toggleNutrient(key: string, checked: boolean) {
    setVisibleRows((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );
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

  function handleRulesetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRulesets((prev) => {
        const oldIndex = prev.findIndex((rs) => rs.id === active.id);
        const newIndex = prev.findIndex((rs) => rs.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleAddRuleset() {
    const newRuleset: NutritionRuleset = {
      id: crypto.randomUUID(),
      name: 'New Ruleset',
      rules: [],
    };
    setRulesets((prev) => [...prev, newRuleset]);
    openDetail(newRuleset, true);
  }

  function handleAddFromTemplate(template: NutritionRuleset) {
    const newRuleset: NutritionRuleset = {
      id: crypto.randomUUID(),
      name: template.name,
      rules: template.rules,
    };
    setRulesets((prev) => [...prev, newRuleset]);
    openDetail(newRuleset, true);
  }

  async function deleteRuleset(id: string, { navigateBack = false } = {}) {
    const updatedRulesets = rulesets.filter((rs) => rs.id !== id);
    const updatedSettings: NutritionSettings = {
      visibleRows,
      showCrown,
      showFlag,
      rowOrder,
      rulesets: updatedRulesets,
    };
    setSaving(true);
    try {
      await saveNutritionSettings(userId, updatedSettings);
      setRulesets(updatedRulesets);
      setSaved(updatedSettings);
      toast.success('Ruleset deleted');
      setDeleteConfirmId(null);
      setShowDetailDeleteConfirm(false);
      if (navigateBack) setView('list');
    } catch {
      toast.error('Failed to delete ruleset');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteFromList() {
    if (!deleteConfirmId) return;
    await deleteRuleset(deleteConfirmId);
  }

  async function handleSave() {
    const current: NutritionSettings = {
      visibleRows,
      showCrown,
      showFlag,
      rulesets,
      rowOrder,
    };
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

  // Detail view handlers
  function updateEditingRule(
    index: number,
    field: keyof NutritionRule,
    value: string | number | undefined,
  ) {
    setDetailSaveAttempted(false);
    setEditingRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function addEditingRule() {
    setDetailSaveAttempted(false);
    setEditingRules((prev) => [
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

  function removeEditingRule(index: number) {
    setEditingRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleEditingRuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditingRules((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function handleDetailSave() {
    setDetailSaveAttempted(true);
    if (!editingName.trim()) {
      toast.error('Ruleset name cannot be empty');
      return;
    }
    if (Object.keys(detailValidationErrors).length > 0) return;

    const cleanRules = editingRules.map((r) => ({
      nutrient: r.nutrient,
      direction: r.direction,
      value: r.value!,
      rating: r.rating,
    }));

    const updatedRulesets = rulesets.map((rs) =>
      rs.id === editingId
        ? { ...rs, name: editingName.trim(), rules: cleanRules }
        : rs,
    );

    const updatedSettings: NutritionSettings = {
      visibleRows,
      showCrown,
      showFlag,
      rowOrder,
      rulesets: updatedRulesets,
    };

    setSaving(true);
    try {
      await saveNutritionSettings(userId, updatedSettings);
      setRulesets(updatedRulesets);
      setSaved(updatedSettings);
      toast.success('Ruleset saved');
      setIsNewRuleset(false);
      setView('list');
    } catch {
      toast.error('Failed to save ruleset');
    } finally {
      setSaving(false);
    }
  }

  function handleDetailCancel() {
    if (isNewRuleset && editingId) {
      setRulesets((prev) => prev.filter((rs) => rs.id !== editingId));
    }
    setView('list');
  }

  async function handleGlobalReset() {
    const defaults = buildDefault();
    setSaving(true);
    try {
      await saveNutritionSettings(userId, defaults);
      setSaved(defaults);
      setVisibleRows(defaults.visibleRows);
      setShowCrown(defaults.showCrown);
      setShowFlag(defaults.showFlag);
      setRulesets(defaults.rulesets);
      setRowOrder(defaults.rowOrder!);
      toast.success('Settings reset to defaults');
    } catch {
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
      setShowResetConfirm(false);
    }
  }

  async function handleDetailDelete() {
    if (!editingId) return;
    await deleteRuleset(editingId, { navigateBack: true });
  }

  if (loading) {
    return <Loader2 className='size-5 animate-spin text-muted-foreground' />;
  }

  if (view === 'detail') {
    return (
      <div className='space-y-8'>
        {/* Ruleset name */}
        <div className='group flex items-center gap-2 border-b border-border pb-1 focus-within:border-ring'>
          <input
            type='text'
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className='min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none'
            aria-label='Ruleset name'
          />
          <Pencil className='size-4 shrink-0 text-muted-foreground' />
        </div>

        {/* Rules editor */}
        <section className='space-y-3'>
          <h3 className='text-base font-semibold'>Rules</h3>
          <div className='overflow-x-auto pb-2'>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleEditingRuleDragEnd}
            >
              <SortableContext
                items={editingRules.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='min-w-max space-y-2'>
                  {editingRules.map((rule, i) => (
                    <SortableRuleRow
                      key={rule.id}
                      rule={rule}
                      index={i}
                      error={detailValidationErrors[i]}
                      showError={detailSaveAttempted}
                      onUpdate={updateEditingRule}
                      onRemove={removeEditingRule}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={addEditingRule}>
              <Plus className='size-4' />
              Add rule
            </Button>
          </div>
        </section>

        {/* Action row */}
        <div className='flex gap-2'>
          <Button onClick={handleDetailSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant='outline'
            onClick={handleDetailCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => setShowDetailDeleteConfirm(true)}
            disabled={saving || isNewRuleset}
            className='ml-auto'
          >
            Delete ruleset
          </Button>
        </div>

        {/* Detail delete confirmation */}
        <AlertDialog
          open={showDetailDeleteConfirm}
          onOpenChange={(open) => !open && setShowDetailDeleteConfirm(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ruleset?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowDetailDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleDetailDelete}
                disabled={saving}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const filteredRulesets = rulesetSearch
    ? rulesets.filter((rs) =>
        rs.name.toLowerCase().includes(rulesetSearch.toLowerCase()),
      )
    : null;

  return (
    <div className='space-y-8'>
      {/* Visible rows */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Visible rows</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleNutrientDragEnd}
        >
          <SortableContext
            items={rowOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2'>
              {rowOrder.map((key) => {
                const row = ALL_ROWS.find((r) => r.key === key);
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

      {/* Rulesets */}
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>Rulesets</h3>
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by name…'
            value={rulesetSearch}
            onChange={(e) => setRulesetSearch(e.target.value)}
            className='pl-8'
          />
        </div>
        {filteredRulesets ? (
          <div className='space-y-1'>
            {filteredRulesets.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                No rulesets match your search.
              </p>
            ) : (
              filteredRulesets.map((rs) => (
                <SortableRulesetRow
                  key={rs.id}
                  ruleset={rs}
                  onView={(ruleset) => openDetail(ruleset)}
                  onDelete={(id) => setDeleteConfirmId(id)}
                />
              ))
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRulesetDragEnd}
          >
            <SortableContext
              items={rulesets.map((rs) => rs.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='space-y-1'>
                {rulesets.map((rs) => (
                  <SortableRulesetRow
                    key={rs.id}
                    ruleset={rs}
                    onView={(ruleset) => openDetail(ruleset)}
                    onDelete={(id) => setDeleteConfirmId(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <div className='flex flex-wrap items-center gap-2'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className='inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50'>
            <Plus className='size-4' />
            Add ruleset
          </DropdownMenuTrigger>
          <DropdownMenuContent side='top'>
            <DropdownMenuItem onClick={handleAddRuleset}>
              New ruleset
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>From template</DropdownMenuLabel>
              {BUILTIN_RULESETS.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleAddFromTemplate(template)}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className='flex gap-2 sm:ml-auto'>
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant='outline'
            onClick={() => setShowResetConfirm(true)}
            disabled={saving}
          >
            Reset to defaults
          </Button>
        </div>
      </div>

      {/* List view delete confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ruleset?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDeleteFromList}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset all settings confirmation */}
      <AlertDialog
        open={showResetConfirm}
        onOpenChange={(open) => !open && setShowResetConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all nutrition settings — visible rows,
              highlights, and rulesets — to their defaults. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleGlobalReset}
              disabled={saving}
            >
              Reset
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
