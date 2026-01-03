"use client"

import { useEffect, useState } from "react"
import { Preferences, Theme } from "@/lib/types"

interface PreferencesDialogProps {
  preferences: Preferences
  close: () => void
  save: (preferences: Preferences) => void
}

export function PreferencesDialog({ preferences, save, close }: PreferencesDialogProps) {
  const [fontSize, setFontSize] = useState(preferences.fontSize)
  const [decimalPlaces, setDecimalPlaces] = useState(preferences.decimalPlaces)
  const [theme, setTheme] = useState(preferences.theme)
  const [decimalSeparator, setDecimalSeparator] = useState(preferences.decimalSeparator)
  const [thousandsSeparator, setThousandsSeparator] = useState(preferences.thousandsSeparator)

  useEffect(() => {
    save({
      fontSize,
      decimalPlaces,
      theme,
      decimalSeparator,
      thousandsSeparator,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, decimalPlaces, theme, thousandsSeparator, decimalSeparator])

  return (
    <div className="modal">
      <div className="mb-4">
        <label className="form-label">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="form-select mr-4"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Font Size</label>
        <input
          type="number"
          min="8"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="form-input w-12 mr-4"
        />
        px
      </div>

      <div className="mb-4">
        <label className="form-label">Decimal Separator</label>
        <input
          type="text"
          maxLength={1}
          value={decimalSeparator}
          onChange={(e) => {
            const val = e.target.value
            if (val === "," || val === ".") {
              setDecimalSeparator(val)
            }
          }}
          className="form-input w-12 mr-4"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Thousands Separator</label>
        <input
          type="text"
          maxLength={1}
          value={thousandsSeparator}
          onChange={(e) => {
            const val = e.target.value
            if (val === "" || val === "," || val === "." || val === " ") {
              setThousandsSeparator(val as "" | "," | "." | " ")
            }
          }}
          className="form-input w-12 mr-4"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Decimal Places</label>
        <input
          type="number"
          min="2"
          max="8"
          value={decimalPlaces}
          onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
          className="form-input w-12 mr-4"
        />
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={close} className="cursor-pointer underline text-[var(--text-color)]">
          Close
        </button>
      </div>
    </div>
  )
}
