import { EditorView } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"

export const colors = {
  light: "hsl(0, 0%, 70%)", // Very light gray for comments
  medium: "hsl(0, 0%, 40%)", // Medium gray for plain text
  dark: "hsl(0, 0%, 20%)", // Dark for numbers
  number: "hsl(25, 70%, 45%)", // Orange/brown for numbers
  unit: "hsl(220, 70%, 50%)", // Blue for units/formats
  variable: "hsl(280, 70%, 50%)", // Purple/magenta for variables
  operator: "hsl(0, 0%, 50%)", // Gray for operators
  conversionKeyword: "hsl(150, 60%, 40%)", // Green for conversion keywords (to, in)
  background: "hsl(0, 0%, 98%)",
  darkBackground: "hsl(0, 0%, 95%)",
  highlightBackground: "hsl(0, 0%, 100%)",
  selection: "hsl(0, 0%, 90)",
  cursor: "#528bff",
}

const lightTheme = EditorView.theme(
  {
    "&": {
      color: "hsl(0, 0%, 50%)",
      backgroundColor: colors.background,
      "--cm-background": colors.background,
      "--separator-bg": "hsl(0, 0%, 94%)",
      "--separator-border": "hsl(0, 0%, 80%)",
      "--separator-text": "hsl(0, 0%, 40%)",
    },
    ".cm-content": {
      caretColor: colors.cursor,
    },
    "&.cm-focused .cm-cursor": { borderLeftColor: colors.cursor },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: colors.selection,
    },
    ".cm-searchMatch": {
      backgroundColor: colors.selection,
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#6199ff2f",
    },
    ".cm-selectionMatch": { backgroundColor: colors.selection },
    ".cm-activeLine, .cm-activeLineGutter, .cm-activeLineRightGutter": {
      backgroundColor: colors.highlightBackground,
    },
    ".cm-tooltip": {
      border: "none",
      backgroundColor: colors.darkBackground,
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      fontFamily: "inherit",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: colors.selection,
      },
    },
    ".cm-right-gutters": {
      backgroundColor: colors.darkBackground,
      color: colors.medium,
    },
    // Custom syntax highlighting for conversion keywords
    ".tok-conversionKeyword": {
      color: colors.conversionKeyword,
      fontWeight: "500",
    },
  },
  { dark: false }
)

const lightHighlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.name,
      tags.deleted,
      tags.character,
      tags.propertyName,
      tags.macroName,
      tags.function(tags.variableName),
      tags.labelName,
      tags.color,
      tags.constant(tags.name),
      tags.standard(tags.name),
      tags.definition(tags.name),
      tags.separator,
      tags.typeName,
      tags.className,
      tags.changed,
      tags.annotation,
      tags.modifier,
      tags.self,
      tags.namespace,
      tags.url,
      tags.escape,
      tags.regexp,
      tags.link,
      tags.atom,
      tags.bool,
    ],
    color: colors.medium,
  },
  {
    tag: [tags.number, tags.string],
    color: colors.number,
  },
  {
    tag: [tags.unit],
    color: colors.unit,
  },
  {
    tag: [tags.variableName],
    color: colors.variable,
  },
  {
    tag: [tags.operator, tags.operatorKeyword],
    color: colors.operator,
  },
  {
    tag: [tags.keyword],
    color: colors.conversionKeyword,
    fontWeight: "500",
  },
  {
    tag: [tags.meta, tags.comment],
    color: colors.light,
  },
])

export const light = [lightTheme, syntaxHighlighting(lightHighlightStyle)]
