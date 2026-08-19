import type { Tool } from '../../engine/canvas/strokes';

/**
 * Drawing toolbar.
 *
 * Deliberately tiny: pen, eraser, undo, and a short colour row when a mode
 * wants one. The canvas is the hero during a turn — a full toolbar would steal
 * both space and attention, and most turns in this game last seconds.
 *
 * The tool buttons carry Arabic TEXT labels, not icons. That is the sanctioned
 * temporary state from ART_BIBLE.md: until the وش ذا؟ icon assets are generated
 * with Higgsfield, text is the fallback — never an emoji, never a glyph from an
 * icon pack.
 *
 * Selected/unselected uses the same wt-btn-ink / wt-btn-secondary button
 * assets as everywhere else a tool state toggles (ASSET_MANIFEST.md Batch 13)
 * — a black scribble-filled ring for the active tool, a white one otherwise.
 */

export interface DrawingToolsProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  /** Optional palette. Omit entirely for modes with one pen per player. */
  colors?: readonly string[];
  color?: string;
  onColorChange?: (color: string) => void;
  /**
   * Drop the eraser button entirely. The eraser composites onto the shared
   * canvas bitmap regardless of who drew what beneath it — fine when a turn
   * belongs to one player at a time, but in الرسم المشترك's Duo ruleset a
   * 2-3 second turn has no time for anyone to police that, so the tool is
   * removed rather than trusted.
   */
  hideEraser?: boolean;
}

export function DrawingTools({
  tool,
  onToolChange,
  onUndo,
  canUndo,
  disabled = false,
  colors,
  color,
  onColorChange,
  hideEraser = false,
}: DrawingToolsProps) {
  const buttonBase =
    'min-h-tap flex-1 wt-btn-sm px-3 font-display text-base ' +
    'transition-[transform,box-shadow,filter] duration-instant ease-bounce ' +
    'disabled:opacity-40 disabled:active:translate-y-0';
  const unselected =
    'wt-btn-secondary text-ink shadow-1 active:translate-y-[2px] active:shadow-pressed active:brightness-90';
  const selected = 'wt-btn-ink text-paper shadow-1';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={tool === 'pen'}
          onClick={() => onToolChange('pen')}
          className={[buttonBase, tool === 'pen' ? selected : unselected].join(' ')}
        >
          قلم
        </button>

        {!hideEraser && (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={tool === 'eraser'}
            onClick={() => onToolChange('eraser')}
            className={[buttonBase, tool === 'eraser' ? selected : unselected].join(' ')}
          >
            ممحاة
          </button>
        )}

        <button
          type="button"
          disabled={disabled || !canUndo}
          onClick={onUndo}
          className={[buttonBase, unselected].join(' ')}
        >
          تراجع
        </button>
      </div>

      {colors && colors.length > 1 && onColorChange && (
        <div className="flex gap-2" role="radiogroup" aria-label="لون القلم">
          {colors.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === color}
              aria-label={`لون ${option}`}
              disabled={disabled}
              onClick={() => onColorChange(option)}
              style={{ backgroundColor: option }}
              className={[
                'h-tap w-tap rounded-pill border-bold transition-transform duration-instant',
                option === color ? 'border-ink scale-110 shadow-1' : 'border-ink-hairline',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
