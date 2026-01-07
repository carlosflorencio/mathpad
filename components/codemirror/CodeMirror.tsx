"use client"

import { Compartment, EditorState, Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useEffect, useRef } from "react"

interface CodeMirrorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string
  onChange?: (value: string) => void
  extensions?: Extension
}

export function CodeMirror({
  value: valueProp,
  onChange: onChangeProp,
  extensions = [],
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

  // Update refs after render to avoid setting refs during render
  useEffect(() => {
    valueRef.current = valueProp
    onChangeRef.current = onChangeProp
  })

  useEffect(() => {
    if (editorParentElRef.current !== null) {
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
    }

    return () => {
      if (editorRef.current !== null) {
        editorRef.current.view.destroy()
        editorRef.current = null
      }
    }
  }, [editorParentElRef])

  useEffect(() => {
    const changeHandler = changeHandlerRef.current
    const handledChange = changeHandler?.(valueProp)
    if (handledChange !== true && editorRef.current !== null) {
      // Only update if the content actually differs from what's in the editor
      const currentContent = editorRef.current.view.state.doc.toString()
      if (currentContent !== valueProp) {
        editorRef.current.view.dispatch(
          editorRef.current.view.state.update({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: valueProp,
            },
            filter: false,
          })
        )
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
