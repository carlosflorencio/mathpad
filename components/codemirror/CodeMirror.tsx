"use client"

import { EditorState, Extension, Transaction } from "@codemirror/state"
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
  valueRef.current = valueProp

  const onChangeRef = useRef(onChangeProp)
  onChangeRef.current = onChangeProp

  const extensionsRef = useRef<Extension>(extensions)

  const editorParentElRef = useRef<HTMLDivElement | null>(null)

  const editorRef = useRef<null | {
    view: EditorView
  }>(null)

  const changeHandlerRef = useRef<null | ((newValue: string) => boolean)>(null)

  useEffect(() => {
    if (editorParentElRef.current !== null) {
      let view: EditorView | undefined = undefined
      const state: EditorState = EditorState.create({
        doc: valueRef.current,
        extensions: [
          EditorView.theme({
            "&": { alignSelf: "stretch", flex: "1 0 auto" },
          }),
          extensionsRef.current,
          EditorState.transactionExtender.of((tr: Transaction) => {
            const editorView = view
            if (editorView !== undefined) {
              const prevDoc = editorView.state.doc.toString()
              const nextDoc = tr.newDoc.toString()
              if (prevDoc === nextDoc) {
                return tr
              } else {
                changeHandlerRef.current = (newValue: string) => {
                  changeHandlerRef.current = null
                  return newValue === nextDoc
                }
                onChangeRef.current?.(nextDoc)
                return null
              }
            } else {
              return null
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
      editorRef.current.view.dispatch(
        editorRef.current.view.state.update({
          changes: {
            from: 0,
            to: editorRef.current.view.state.doc.toString().length,
            insert: valueProp,
          },
          filter: false,
        })
      )
    }
  }, [valueProp])

  return <div {...props} ref={editorParentElRef} />
}
