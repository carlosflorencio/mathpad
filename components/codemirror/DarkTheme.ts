import { EditorView } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"

export const colors = {
  light: "hsl(95, 6.7%, 64.7%)",
  medium: "hsl(180, 14.9%, 46.1%)",
  dark: "hsl(90, 3.3%, 47.1%)",
  number: "hsl(25, 70%, 60%)", // Orange/brown for numbers (lighter for dark theme)
  unit: "hsl(210, 80%, 65%)", // Blue for units/formats
  variable: "hsl(280, 65%, 70%)", // Purple/magenta for variables (lighter for dark theme)
  operator: "hsl(0, 0%, 60%)", // Gray for operators
  conversionKeyword: "hsl(150, 60%, 55%)", // Green for conversion keywords (to, in) - lighter for dark theme
  background: "hsl(220, 13%, 18%)",
  darkBackground: "hsl(216, 13.2%, 14.9%)",
  highlightBackground: "hsl(218.6, 13.7%, 20%)",
  tooltipBackground: "hsl(216.9, 10.9%, 23.3%)",
  selection: "hsl(221.1, 13.3%, 28%)",
  cursor: "hsl(220.2, 100%, 66.1%)",
}

const darkTheme = EditorView.theme(
  {
    "&": {
      color: "rgba(214, 221, 209)",
      backgroundColor: colors.background,
      "--cm-background": colors.background,
      "--separator-bg": "hsl(220, 13%, 22%)",
      "--separator-border": "hsl(220, 13%, 30%)",
      "--separator-text": "hsl(180, 14.9%, 46.1%)",
    },
    ".cm-content": {
      caretColor: colors.cursor,
    },
    "&.cm-focused .cm-cursor": { borderLeftColor: colors.cursor },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: colors.selection,
    },
    ".cm-panels": { backgroundColor: colors.darkBackground },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },
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
      backgroundColor: colors.tooltipBackground,
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      fontFamily: "inherit",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: colors.highlightBackground,
      },
    },
    ".cm-right-gutters": {
      backgroundColor: "rgb(41, 41, 46)",
      color: colors.light,
    },
    // Custom syntax highlighting for conversion keywords
    ".tok-conversionKeyword": {
      color: colors.conversionKeyword,
      fontWeight: "500",
    },
  },
  { dark: true }
)

const darkHighlightStyle = HighlightStyle.define([
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
    color: colors.light,
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
    color: colors.dark,
  },
])

export const dark = [darkTheme, syntaxHighlighting(darkHighlightStyle)]
