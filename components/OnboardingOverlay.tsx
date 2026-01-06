interface OnboardingOverlayProps {
  onInsertTemplate: () => void
  onDismiss: () => void
}

export const EXAMPLE_TEMPLATE = `netflix = 8$
rent = 600$

expenses = netflix + rent

---

# Currency conversion
price_usd = 100$
price_eur = price_usd * 0.85EUR  # USD to EUR

---

# Units
distance = 5 km
distance_miles = distance * 0.621371 mi

weight = 10 kg
weight_lbs = weight * 2.20462 lb

---

# Dates
today = today()
days_in_month = 30

---

# Check the syntax modal (? icon) for more examples!`

export function OnboardingOverlay({ onInsertTemplate, onDismiss }: OnboardingOverlayProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center select-none"
      style={{
        zIndex: 30,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
      }}
      onClick={onDismiss}
    >
      <div
        className="rounded-lg shadow-lg p-6 max-w-md"
        style={{
          backgroundColor: "var(--cm-background)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--ui-border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              Welcome to MathPad
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              All your data is stored locally in the browser
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onInsertTemplate()
                onDismiss()
              }}
              className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-button-hover)",
                color: "var(--text-color)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-input)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-button-hover)"
              }}
            >
              Insert example template
            </button>

            <button
              onClick={onDismiss}
              className="w-full px-4 py-2 rounded text-sm transition-colors"
              style={{
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-color)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)"
              }}
            >
              Start with a blank note
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Click anywhere or press ESC to dismiss
          </p>
        </div>
      </div>
    </div>
  )
}
