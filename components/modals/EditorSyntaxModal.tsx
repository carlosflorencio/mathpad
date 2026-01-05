interface EditorSyntaxModalProps {
  onClose: () => void
}

export function EditorSyntaxModal({ onClose }: EditorSyntaxModalProps) {
  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Editor Syntax Guide</h2>

      <div className="space-y-6 text-[var(--text-color)]">
        {/* Basic Operations */}
        <div>
          <h3 className="font-semibold mb-3">Basic Operations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 + 5</code>
              <span className="text-[var(--text-muted)]">→ 15</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 - 5</code>
              <span className="text-[var(--text-muted)]">→ 5</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 * 5</code>
              <span className="text-[var(--text-muted)]">→ 50</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 / 5</code>
              <span className="text-[var(--text-muted)]">→ 2</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 ^ 2</code>
              <span className="text-[var(--text-muted)]">→ 100 (power)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>10 % 3</code>
              <span className="text-[var(--text-muted)]">→ 1 (modulo)</span>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div>
          <h3 className="font-semibold mb-3">Variables</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>price = 100</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">Assign a value to a variable</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>tax = price * 0.1</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">Use variables in calculations</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>total = price + tax</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Variables update automatically
              </p>
            </div>
          </div>
        </div>

        {/* Functions */}
        <div>
          <h3 className="font-semibold mb-3">Functions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>sqrt(16)</code>
              <span className="text-[var(--text-muted)]">→ 4</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>abs(-10)</code>
              <span className="text-[var(--text-muted)]">→ 10</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>round(3.7)</code>
              <span className="text-[var(--text-muted)]">→ 4</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>ceil(3.2)</code>
              <span className="text-[var(--text-muted)]">→ 4</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>floor(3.8)</code>
              <span className="text-[var(--text-muted)]">→ 3</span>
            </div>
          </div>
        </div>

        {/* Units */}
        <div>
          <h3 className="font-semibold mb-3">Units & Formatting</h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Add units after calculations to format results:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>1000 | usd</code>
              <span className="text-[var(--text-muted)]">→ $1,000.00</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>5280 | ft</code>
              <span className="text-[var(--text-muted)]">→ 5,280 ft</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>3600 | sec</code>
              <span className="text-[var(--text-muted)]">→ 1 hr</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
              <code>1500000 | millions</code>
              <span className="text-[var(--text-muted)]">→ 1.5M</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            <strong>Available units:</strong> usd, eur, ft, m, km, mi, kg, lb, g, L, ml, gal, sec,
            min, hr, mph, kmh, mps, thousands, millions, billions
          </p>
        </div>

        {/* Aggregates */}
        <div>
          <h3 className="font-semibold mb-3">Aggregate Functions</h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Use aggregates on multiple values (one per line):
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>sum([10, 20, 30])</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">→ 60</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>avg([10, 20, 30])</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">→ 20</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>max([10, 20, 30])</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">→ 30</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>min([10, 20, 30])</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">→ 10</p>
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <code>count([10, 20, 30])</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">→ 3</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[var(--bg-input)] p-4 rounded">
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
            <li>Results appear on the right as you type</li>
            <li>Click any result to copy it to clipboard</li>
            <li>Variables update automatically when dependencies change</li>
            <li>Use parentheses to control order of operations</li>
            <li>Comments start with # (not calculated)</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
