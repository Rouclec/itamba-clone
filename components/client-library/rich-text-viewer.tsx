'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo } from 'react'

/** Default empty ProseMirror doc for TipTap */
const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

function parseContent(raw: string | undefined): object {
  if (!raw || !raw.trim()) return EMPTY_DOC
  const s = raw.trim()
  if (s.startsWith('{')) {
    try {
      const parsed = JSON.parse(s) as object
      if (parsed && typeof parsed === 'object' && 'type' in parsed) return parsed
    } catch {
      // fallback to plain text
    }
  }
  // Plain text: wrap in a doc with one paragraph containing text
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: s }] }],
  }
}

export function RichTextViewer({ content }: { content: string | undefined }) {
  const parsed = useMemo(() => parseContent(content), [content])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: parsed,
    editable: false,
    editorProps: {
      attributes: {
        class: 'text-body-text text-sm font-merriweather focus:outline-none [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(parsed, false)
  }, [editor, parsed])

  if (!editor) return null

  return <EditorContent editor={editor} />
}
