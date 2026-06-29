"use client"

import { Compartment, EditorState, Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useEffect, useRef } from "react"

interface CodeMirrorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string
  onChange?: (value: string) => void
  extensions?: Extension
  noteId?: string
}

export function CodeMirror({
  value: valueProp,
  onChange: onChangeProp,
  extensions = [],
  noteId,
  ...props
}: CodeMirrorProps) {
  const valueRef = useRef(valueProp)
  const onChangeRef = useRef(onChangeProp)
  const extensionsRef = useRef<Extension>(extensions)
  const editorParentElRef = useRef<HTMLDivElement | null>(null)

  const editorRef = useRef<null | {
    view: EditorView
  }>(null)

  const changeHandlerRef = useRef<null | ((newValue: string) => boolean)>(null)
  const extensionsCompartmentRef = useRef(new Compartment())
  const cursorSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRestoringCursorRef = useRef(false)
  const noteIdRef = useRef(noteId)
  const hasRestoredCursorRef = useRef(false)

  // Update refs after render to avoid setting refs during render
  useEffect(() => {
    valueRef.current = valueProp
    onChangeRef.current = onChangeProp
    noteIdRef.current = noteId
  })

  // Save cursor position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current && noteIdRef.current && typeof window !== "undefined") {
        const selection = editorRef.current.view.state.selection.main
        const position = { from: selection.from, to: selection.to }
        localStorage.setItem(`cursor-position-${noteIdRef.current}`, JSON.stringify(position))
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  useEffect(() => {
    if (editorParentElRef.current !== null) {
      // Reset cursor restoration flag when creating new editor
      hasRestoredCursorRef.current = false

      let view: EditorView | undefined = undefined
      const state: EditorState = EditorState.create({
        doc: valueRef.current,
        extensions: [
          EditorView.theme({
            "&": { height: "100%", flex: "1 1 auto", display: "flex", flexDirection: "column" },
            ".cm-scroller": { flex: "1 1 auto" },
          }),
          extensionsCompartmentRef.current.of(extensionsRef.current),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const nextDoc = update.state.doc.toString()
              changeHandlerRef.current = (newValue: string) => {
                changeHandlerRef.current = null
                return newValue === nextDoc
              }
              onChangeRef.current?.(nextDoc)
            }

            // Save cursor position when selection changes (debounced)
            if (
              update.selectionSet &&
              noteIdRef.current &&
              typeof window !== "undefined" &&
              !isRestoringCursorRef.current
            ) {
              // Clear any pending save
              if (cursorSaveTimeoutRef.current) {
                clearTimeout(cursorSaveTimeoutRef.current)
              }

              // Debounce save by 100ms
              cursorSaveTimeoutRef.current = setTimeout(() => {
                if (editorRef.current) {
                  const selection = editorRef.current.view.state.selection.main
                  const position = { from: selection.from, to: selection.to }
                  localStorage.setItem(
                    `cursor-position-${noteIdRef.current}`,
                    JSON.stringify(position)
                  )
                }
              }, 100)
            }
          }),
        ],
      })
      view = new EditorView({
        state,
        parent: editorParentElRef.current,
      })
      editorRef.current = {
        view,
      }

      // Focus the editor immediately for better UX
      setTimeout(() => {
        if (view && !view.hasFocus) {
          view.focus()
        }
      }, 0)

      // Restore cursor position after everything settles (fallback)
      // This ensures cursor is restored even after value updates
      setTimeout(() => {
        if (view && noteId && typeof window !== "undefined") {
          const saved = localStorage.getItem(`cursor-position-${noteId}`)
          if (saved) {
            try {
              isRestoringCursorRef.current = true
              const position = JSON.parse(saved) as { from: number; to: number }
              const docLength = view.state.doc.length
              const from = Math.min(position.from, docLength)
              const to = Math.min(position.to, docLength)
              view.dispatch({
                selection: { anchor: from, head: to },
                scrollIntoView: true,
              })
              hasRestoredCursorRef.current = true
              setTimeout(() => {
                isRestoringCursorRef.current = false
              }, 100)
            } catch (e) {
              console.error("Failed to restore cursor position:", e)
            }
          } else {
            hasRestoredCursorRef.current = true
          }
        } else {
          hasRestoredCursorRef.current = true
        }
      }, 50)
    }

    return () => {
      // Clear any pending cursor save
      if (cursorSaveTimeoutRef.current) {
        clearTimeout(cursorSaveTimeoutRef.current)
      }

      if (editorRef.current !== null) {
        editorRef.current.view.destroy()
        editorRef.current = null
      }
    }
  }, [editorParentElRef, noteId])

  useEffect(() => {
    const changeHandler = changeHandlerRef.current
    const handledChange = changeHandler?.(valueProp)
    if (handledChange !== true && editorRef.current !== null) {
      // Only update if the content actually differs from what's in the editor
      const currentContent = editorRef.current.view.state.doc.toString()
      if (currentContent !== valueProp) {
        // Get the saved cursor position if we've already restored it
        const savedSelection = hasRestoredCursorRef.current
          ? editorRef.current.view.state.selection.main
          : null

        // Update the document
        editorRef.current.view.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: valueProp,
          },
        })

        // Restore cursor position after content update
        if (savedSelection && hasRestoredCursorRef.current) {
          const docLength = editorRef.current.view.state.doc.length
          const from = Math.min(savedSelection.from, docLength)
          const to = Math.min(savedSelection.to, docLength)
          editorRef.current.view.dispatch({
            selection: { anchor: from, head: to },
          })
        }
      }
    }
  }, [valueProp])

  // Reconfigure extensions when they change (e.g., theme switch)
  useEffect(() => {
    if (editorRef.current !== null) {
      editorRef.current.view.dispatch({
        effects: extensionsCompartmentRef.current.reconfigure(extensions),
      })
    }
  }, [extensions])

  return (
    <div
      {...props}
      ref={editorParentElRef}
      style={{ display: "flex", flexDirection: "column", flex: 1, ...props.style }}
      onClick={(e) => {
        // Focus the editor when clicking anywhere in the container
        if (editorRef.current && !editorRef.current.view.hasFocus) {
          editorRef.current.view.focus()
        }
        props.onClick?.(e)
      }}
    />
  )
}
