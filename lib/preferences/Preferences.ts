export class Preferences {
  constructor(
    public readonly fontSize: number,
    public readonly decimalPlaces: number,
    public readonly decimalSeparator: "," | ".",
    public readonly thousandsSeparator: "," | "." | " " | "",
    public readonly theme: "dark" | "light"
  ) {}

  static default(): Preferences {
    return new Preferences(18, 2, ".", ",", "dark")
  }

  withFontSize(size: number): Preferences {
    return new Preferences(
      size,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme
    )
  }

  withDecimalPlaces(places: number): Preferences {
    return new Preferences(
      this.fontSize,
      places,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme
    )
  }

  withDecimalSeparator(separator: "," | "."): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      separator,
      this.thousandsSeparator,
      this.theme
    )
  }

  withThousandsSeparator(separator: "," | "." | " " | ""): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      separator,
      this.theme
    )
  }

  withTheme(theme: "dark" | "light"): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      theme
    )
  }

  toJSON() {
    return {
      fontSize: this.fontSize,
      decimalPlaces: this.decimalPlaces,
      decimalSeparator: this.decimalSeparator,
      thousandsSeparator: this.thousandsSeparator,
      theme: this.theme,
    }
  }

  static fromJSON(data: {
    fontSize: number
    decimalPlaces: number
    decimalSeparator: "," | "."
    thousandsSeparator: "," | "." | " " | ""
    theme: "dark" | "light"
  }): Preferences {
    return new Preferences(
      data.fontSize,
      data.decimalPlaces,
      data.decimalSeparator,
      data.thousandsSeparator,
      data.theme
    )
  }
}
