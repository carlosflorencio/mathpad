'use client';

import { useEffect, useState } from 'react';
import { Preferences, Theme } from '@/lib/types';

interface PreferencesDialogProps {
  preferences: Preferences;
  close: () => void;
  save: (preferences: Preferences) => void;
}

export function PreferencesDialog({ preferences, save, close }: PreferencesDialogProps) {
  const [fontSize, setFontSize] = useState(preferences.fontSize);
  const [decimalPlaces, setDecimalPlaces] = useState(preferences.decimalPlaces);
  const [theme, setTheme] = useState(preferences.theme);
  const [decimalSeparator, setDecimalSeparator] = useState(preferences.decimalSeparator);
  const [thousandsSeparator, setThousandsSeparator] = useState(preferences.thousandsSeparator);

  useEffect(() => {
    save({
      fontSize,
      decimalPlaces,
      theme,
      decimalSeparator,
      thousandsSeparator,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, decimalPlaces, theme, thousandsSeparator, decimalSeparator]);

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-[hsl(220,13%,18%)]' : 'bg-[hsl(0,0%,95%)]';
  const textColor = isDark ? 'text-[rgba(214,221,209)]' : 'text-[hsl(0,0%,50%)]';
  const borderColor = 'border-black';

  return (
    <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6 border ${borderColor} ${bgColor} ${textColor}`}>
      <div className="mb-4">
        <label className="inline-block w-48">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="border border-black px-2 py-1 mr-4 bg-white text-black"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="inline-block w-48">Font Size</label>
        <input
          type="number"
          min="8"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-12 border border-black px-2 py-1 mr-4 bg-white text-black"
        />
        px
      </div>

      <div className="mb-4">
        <label className="inline-block w-48">Decimal Separator</label>
        <input
          type="text"
          maxLength={1}
          value={decimalSeparator}
          onChange={(e) => {
            const val = e.target.value;
            if (val === ',' || val === '.') {
              setDecimalSeparator(val);
            }
          }}
          className="w-12 border border-black px-2 py-1 mr-4 bg-white text-black"
        />
      </div>

      <div className="mb-4">
        <label className="inline-block w-48">Thousands Separator</label>
        <input
          type="text"
          maxLength={1}
          value={thousandsSeparator}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || val === ',' || val === '.' || val === ' ') {
              setThousandsSeparator(val as '' | ',' | '.' | ' ');
            }
          }}
          className="w-12 border border-black px-2 py-1 mr-4 bg-white text-black"
        />
      </div>

      <div className="mb-4">
        <label className="inline-block w-48">Decimal Places</label>
        <input
          type="number"
          min="2"
          max="8"
          value={decimalPlaces}
          onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
          className="w-12 border border-black px-2 py-1 mr-4 bg-white text-black"
        />
      </div>

      <div className="flex justify-end mt-6">
        <span onClick={() => close()} className="cursor-pointer underline">
          Close
        </span>
      </div>
    </div>
  );
}
