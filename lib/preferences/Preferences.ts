export class Preferences {
  constructor(
    public readonly fontSize: number,
    public readonly decimalPlaces: number,
    public readonly decimalSeparator: "," | ".",
    public readonly thousandsSeparator: "," | "." | " " | "",
    public readonly theme: "dark" | "light",
    public readonly hasSeenOnboarding: boolean,
    public readonly vimMode: boolean
  ) {}

  static default(): Preferences {
    return new Preferences(18, 2, ".", ",", "dark", false, false)
  }

  withFontSize(size: number): Preferences {
    return new Preferences(
      size,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding,
      this.vimMode
    )
  }

  withDecimalPlaces(places: number): Preferences {
    return new Preferences(
      this.fontSize,
      places,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding,
      this.vimMode
    )
  }

  withDecimalSeparator(separator: "," | "."): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      separator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding,
      this.vimMode
    )
  }

  withThousandsSeparator(separator: "," | "." | " " | ""): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      separator,
      this.theme,
      this.hasSeenOnboarding,
      this.vimMode
    )
  }

  withTheme(theme: "dark" | "light"): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      theme,
      this.hasSeenOnboarding,
      this.vimMode
    )
  }

  withOnboardingComplete(): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      true,
      this.vimMode
    )
  }

  withVimMode(enabled: boolean): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding,
      enabled
    )
  }

  toJSON() {
    return {
      fontSize: this.fontSize,
      decimalPlaces: this.decimalPlaces,
      decimalSeparator: this.decimalSeparator,
      thousandsSeparator: this.thousandsSeparator,
      theme: this.theme,
      hasSeenOnboarding: this.hasSeenOnboarding,
      vimMode: this.vimMode,
    }
  }

  static fromJSON(data: {
    fontSize: number
    decimalPlaces: number
    decimalSeparator: "," | "."
    thousandsSeparator: "," | "." | " " | ""
    theme: "dark" | "light"
    hasSeenOnboarding: boolean
    vimMode?: boolean
  }): Preferences {
    return new Preferences(
      data.fontSize,
      data.decimalPlaces,
      data.decimalSeparator,
      data.thousandsSeparator,
      data.theme,
      data.hasSeenOnboarding,
      data.vimMode ?? false
    )
  }
}
