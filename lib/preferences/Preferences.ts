export class Preferences {
  constructor(
    public readonly fontSize: number,
    public readonly decimalPlaces: number,
    public readonly decimalSeparator: "," | ".",
    public readonly thousandsSeparator: "," | "." | " " | "",
    public readonly theme: "dark" | "light",
    public readonly hasSeenOnboarding: boolean
  ) {}

  static default(): Preferences {
    return new Preferences(18, 2, ".", ",", "dark", false)
  }

  withFontSize(size: number): Preferences {
    return new Preferences(
      size,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding
    )
  }

  withDecimalPlaces(places: number): Preferences {
    return new Preferences(
      this.fontSize,
      places,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding
    )
  }

  withDecimalSeparator(separator: "," | "."): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      separator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding
    )
  }

  withThousandsSeparator(separator: "," | "." | " " | ""): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      separator,
      this.theme,
      this.hasSeenOnboarding
    )
  }

  withTheme(theme: "dark" | "light"): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      theme,
      this.hasSeenOnboarding
    )
  }

  withOnboardingComplete(): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      true
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
    }
  }

  static fromJSON(data: {
    fontSize: number
    decimalPlaces: number
    decimalSeparator: "," | "."
    thousandsSeparator: "," | "." | " " | ""
    theme: "dark" | "light"
    hasSeenOnboarding: boolean
  }): Preferences {
    return new Preferences(
      data.fontSize,
      data.decimalPlaces,
      data.decimalSeparator,
      data.thousandsSeparator,
      data.theme,
      data.hasSeenOnboarding
    )
  }
}
