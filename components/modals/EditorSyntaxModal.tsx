import { useState } from "react"

interface EditorSyntaxModalProps {
  onClose: () => void
}

type Tab = "essential" | "conversions" | "currencies" | "dates"

export function EditorSyntaxModal({ onClose }: EditorSyntaxModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("essential")

  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Editor Syntax Guide</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab("essential")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "essential"
              ? "text-[var(--text-color)] border-b-2 border-[var(--text-color)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
          }`}
        >
          Essential
        </button>
        <button
          onClick={() => setActiveTab("conversions")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "conversions"
              ? "text-[var(--text-color)] border-b-2 border-[var(--text-color)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
          }`}
        >
          Conversions
        </button>
        <button
          onClick={() => setActiveTab("currencies")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "currencies"
              ? "text-[var(--text-color)] border-b-2 border-[var(--text-color)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
          }`}
        >
          Currencies
        </button>
        <button
          onClick={() => setActiveTab("dates")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "dates"
              ? "text-[var(--text-color)] border-b-2 border-[var(--text-color)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
          }`}
        >
          Dates
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6 text-[var(--text-color)] max-h-[60vh] overflow-y-auto">
        {activeTab === "essential" && <EssentialTab />}
        {activeTab === "conversions" && <ConversionsTab />}
        {activeTab === "currencies" && <CurrenciesTab />}
        {activeTab === "dates" && <DatesTab />}
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

function EssentialTab() {
  return (
    <>
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
            <p className="text-xs text-[var(--text-muted)] mt-1">Variables update automatically</p>
          </div>
        </div>
      </div>

      {/* Percentages */}
      <div>
        <h3 className="font-semibold mb-3">Percentages</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 + 20%</code>
            <span className="text-[var(--text-muted)]">→ 120</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 - 15%</code>
            <span className="text-[var(--text-muted)]">→ 85</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>20% of 100</code>
            <span className="text-[var(--text-muted)]">→ 20</span>
          </div>
        </div>
      </div>

      {/* Functions */}
      <div>
        <h3 className="font-semibold mb-3">Math Functions</h3>
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

      {/* Aggregates */}
      <div>
        <h3 className="font-semibold mb-3">Aggregate Functions</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          Operate on multiple lines of results (each value on a new line):
        </p>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <div className="flex flex-col">
              <code className="block">10</code>
              <code className="block">20</code>
              <code className="block">30</code>
              <code className="block">sum</code>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              → 60 (adds all previous numbers)
            </p>
          </div>
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <div className="flex flex-col">
              <code className="block">avg</code>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ 20 (average of above results)</p>
          </div>
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <div className="flex justify-between">
              <span>
                <code>max</code>, <code>min</code>, <code>count</code>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Other aggregate functions</p>
          </div>
        </div>
      </div>

      {/* Formatting */}
      <div>
        <h3 className="font-semibold mb-3">Number Formatting</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1500 in K</code>
            <span className="text-[var(--text-muted)]">→ 1.5K (thousands)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>5000000 in M</code>
            <span className="text-[var(--text-muted)]">→ 5M (millions)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>3000000000 in B</code>
            <span className="text-[var(--text-muted)]">→ 3B (billions)</span>
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
          <li>Use --- as separator to reset calculations</li>
        </ul>
      </div>
    </>
  )
}

function ConversionsTab() {
  return (
    <>
      {/* Distance */}
      <div>
        <h3 className="font-semibold mb-3">Distance Conversions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>5 km to m</code>
            <span className="text-[var(--text-muted)]">→ 5,000m</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1000 m to km</code>
            <span className="text-[var(--text-muted)]">→ 1km</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1 mi to km</code>
            <span className="text-[var(--text-muted)]">→ 1.61km</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 ft to m</code>
            <span className="text-[var(--text-muted)]">→ 30.48m</span>
          </div>
        </div>
      </div>

      {/* Time */}
      <div>
        <h3 className="font-semibold mb-3">Time Conversions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2 hr to min</code>
            <span className="text-[var(--text-muted)]">→ 120min</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>90 min to hr</code>
            <span className="text-[var(--text-muted)]">→ 1.5hr</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>3600 sec to hr</code>
            <span className="text-[var(--text-muted)]">→ 1hr</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>5 min to sec</code>
            <span className="text-[var(--text-muted)]">→ 300sec</span>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div>
        <h3 className="font-semibold mb-3">Weight Conversions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>5 kg to g</code>
            <span className="text-[var(--text-muted)]">→ 5,000g</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1000 g to kg</code>
            <span className="text-[var(--text-muted)]">→ 1kg</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>10 lb to kg</code>
            <span className="text-[var(--text-muted)]">→ 4.54kg</span>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div>
        <h3 className="font-semibold mb-3">Volume Conversions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2 L to ml</code>
            <span className="text-[var(--text-muted)]">→ 2,000ml</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>500 ml to L</code>
            <span className="text-[var(--text-muted)]">→ 0.5L</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1 gal to L</code>
            <span className="text-[var(--text-muted)]">→ 3.79L</span>
          </div>
        </div>
      </div>

      {/* Speed */}
      <div>
        <h3 className="font-semibold mb-3">Speed Conversions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 km/h to mph</code>
            <span className="text-[var(--text-muted)]">→ 62.14mph</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>60 mph to km/h</code>
            <span className="text-[var(--text-muted)]">→ 96.56km/h</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>10 m/s to km/h</code>
            <span className="text-[var(--text-muted)]">→ 36km/h</span>
          </div>
        </div>
      </div>

      {/* Unit Arithmetic */}
      <div>
        <h3 className="font-semibold mb-3">Unit Arithmetic</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          Perform dimensional analysis automatically:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 km / 2 hr</code>
            <span className="text-[var(--text-muted)]">→ 50km/h</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>60 mph * 3 hr</code>
            <span className="text-[var(--text-muted)]">→ 180mi</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>200 km / 100 km/h</code>
            <span className="text-[var(--text-muted)]">→ 2hr</span>
          </div>
        </div>
      </div>

      {/* Available Units */}
      <div className="bg-[var(--bg-input)] p-4 rounded">
        <h3 className="font-semibold mb-2">Available Units</h3>
        <div className="text-sm text-[var(--text-muted)] space-y-1">
          <p>
            <strong>Distance:</strong> km, m, mi, ft
          </p>
          <p>
            <strong>Time:</strong> hr, min, sec, ms, day
          </p>
          <p>
            <strong>Weight:</strong> kg, g, lb
          </p>
          <p>
            <strong>Volume:</strong> L, ml, gal
          </p>
          <p>
            <strong>Speed:</strong> km/h, mph, m/s
          </p>
        </div>
      </div>
    </>
  )
}

function CurrenciesTab() {
  return (
    <>
      {/* Basic Currency */}
      <div>
        <h3 className="font-semibold mb-3">Currency Formatting</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 $</code>
            <span className="text-[var(--text-muted)]">→ $100.00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1500 €</code>
            <span className="text-[var(--text-muted)]">→ €1,500.00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2000 £</code>
            <span className="text-[var(--text-muted)]">→ £2,000.00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100000 ¥</code>
            <span className="text-[var(--text-muted)]">→ ¥100,000</span>
          </div>
        </div>
      </div>

      {/* Currency Conversions */}
      <div>
        <h3 className="font-semibold mb-3">Currency Conversions</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          Convert between currencies using exchange rates:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 $ to €</code>
            <span className="text-[var(--text-muted)]">→ €91.21 (example)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1000 € to $</code>
            <span className="text-[var(--text-muted)]">→ $1,096.37 (example)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>500 £ to €</code>
            <span className="text-[var(--text-muted)]">→ €591.62 (example)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>10000 ¥ to $</code>
            <span className="text-[var(--text-muted)]">→ $68.43 (example)</span>
          </div>
        </div>
      </div>

      {/* Three Letter Codes */}
      <div>
        <h3 className="font-semibold mb-3">Three-Letter Currency Codes</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          You can also use ISO currency codes:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 USD</code>
            <span className="text-[var(--text-muted)]">→ $100.00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>100 USD to EUR</code>
            <span className="text-[var(--text-muted)]">→ €91.21 (example)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>1000 GBP to JPY</code>
            <span className="text-[var(--text-muted)]">→ ¥187,352 (example)</span>
          </div>
        </div>
      </div>

      {/* Currency Calculations */}
      <div>
        <h3 className="font-semibold mb-3">Currency Calculations</h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <code className="block">price = 100 $</code>
            <code className="block mt-1">tax = price * 0.1</code>
            <code className="block mt-1">total = price + tax</code>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ $100.00, $10.00, $110.00</p>
          </div>
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <code className="block">budget in K = 50000 $</code>
            <code className="block mt-1">budget</code>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ $50K, $50K</p>
          </div>
        </div>
      </div>

      {/* Supported Currencies */}
      <div className="bg-[var(--bg-input)] p-4 rounded">
        <h3 className="font-semibold mb-2">Supported Currencies</h3>
        <div className="text-sm text-[var(--text-muted)] grid grid-cols-2 gap-2">
          <div>
            <p>$ (USD) - US Dollar</p>
            <p>€ (EUR) - Euro</p>
            <p>£ (GBP) - British Pound</p>
            <p>¥ (JPY) - Japanese Yen</p>
            <p>¥ (CNY) - Chinese Yuan</p>
          </div>
          <div>
            <p>₹ (INR) - Indian Rupee</p>
            <p>₣ (CHF) - Swiss Franc</p>
            <p>$ (CAD) - Canadian Dollar</p>
            <p>$ (AUD) - Australian Dollar</p>
            <p>...and many more</p>
          </div>
        </div>
      </div>
    </>
  )
}

function DatesTab() {
  return (
    <>
      {/* Date Literals */}
      <div>
        <h3 className="font-semibold mb-3">Date Literals</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2024-12-25</code>
            <span className="text-[var(--text-muted)]">→ 2024-12-25</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2024-12-25T10:30:00</code>
            <span className="text-[var(--text-muted)]">→ 2024-12-25 10:30:00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>today()</code>
            <span className="text-[var(--text-muted)]">→ Current date</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>now()</code>
            <span className="text-[var(--text-muted)]">→ Current date & time</span>
          </div>
        </div>
      </div>

      {/* Date Arithmetic */}
      <div>
        <h3 className="font-semibold mb-3">Date Arithmetic</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>today() + 7 day</code>
            <span className="text-[var(--text-muted)]">→ Date 7 days from now</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>today() - 30 day</code>
            <span className="text-[var(--text-muted)]">→ Date 30 days ago</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>now() + 2 hr</code>
            <span className="text-[var(--text-muted)]">→ Time 2 hours from now</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>now() - 45 min</code>
            <span className="text-[var(--text-muted)]">→ Time 45 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Date Differences */}
      <div>
        <h3 className="font-semibold mb-3">Date Differences</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">Calculate time between dates:</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2024-12-25 - 2024-12-20</code>
            <span className="text-[var(--text-muted)]">→ 5day</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2024-12-31 - today()</code>
            <span className="text-[var(--text-muted)]">→ Days until New Year</span>
          </div>
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <code className="block">start = 2024-01-01T10:00:00</code>
            <code className="block mt-1">end = 2024-01-01T14:30:00</code>
            <code className="block mt-1">end - start</code>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ 4.5hr</p>
          </div>
        </div>
      </div>

      {/* Date Extraction Functions */}
      <div>
        <h3 className="font-semibold mb-3">Date Extraction Functions</h3>
        <p className="text-sm text-[var(--text-muted)] mb-2">Extract components from dates:</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>year(2024-12-25)</code>
            <span className="text-[var(--text-muted)]">→ 2024</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>month(2024-12-25)</code>
            <span className="text-[var(--text-muted)]">→ 12</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>day(2024-12-25)</code>
            <span className="text-[var(--text-muted)]">→ 25</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>hour(now())</code>
            <span className="text-[var(--text-muted)]">→ Current hour (0-23)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>minute(now())</code>
            <span className="text-[var(--text-muted)]">→ Current minute (0-59)</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>second(now())</code>
            <span className="text-[var(--text-muted)]">→ Current second (0-59)</span>
          </div>
        </div>
      </div>

      {/* Duration Arithmetic */}
      <div>
        <h3 className="font-semibold mb-3">Duration Arithmetic</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>2 hr + 30 min</code>
            <span className="text-[var(--text-muted)]">→ 2.5hr</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>90 min - 30 min</code>
            <span className="text-[var(--text-muted)]">→ 1hr</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>45 min * 2</code>
            <span className="text-[var(--text-muted)]">→ 1.5hr</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded">
            <code>3 hr / 2</code>
            <span className="text-[var(--text-muted)]">→ 1.5hr</span>
          </div>
        </div>
      </div>

      {/* Real-World Examples */}
      <div>
        <h3 className="font-semibold mb-3">Real-World Examples</h3>
        <div className="space-y-3 text-sm">
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <p className="text-xs text-[var(--text-muted)] mb-1">Project timeline:</p>
            <code className="block">start = 2024-01-15</code>
            <code className="block mt-1">duration = 90 day</code>
            <code className="block mt-1">deadline = start + duration</code>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ 2024-04-14</p>
          </div>
          <div className="p-2 bg-[var(--bg-input)] rounded">
            <p className="text-xs text-[var(--text-muted)] mb-1">Age calculation:</p>
            <code className="block">birthday = 1990-06-15</code>
            <code className="block mt-1">(today() - birthday) / 365 day</code>
            <p className="text-xs text-[var(--text-muted)] mt-1">→ Your age in years</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[var(--bg-input)] p-4 rounded">
        <h3 className="font-semibold mb-2">Notes</h3>
        <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
          <li>Dates use ISO 8601 format: YYYY-MM-DD</li>
          <li>Datetime includes time: YYYY-MM-DDTHH:mm:ss</li>
          <li>All date calculations use UTC timezone</li>
          <li>Date differences automatically return appropriate units</li>
          <li>Durations can be added to/subtracted from dates</li>
        </ul>
      </div>
    </>
  )
}
