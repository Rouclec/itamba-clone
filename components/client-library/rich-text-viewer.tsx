'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
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
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
        link: false,
      }),
      Link.configure({ openOnClick: false }),
      TableKit,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
    ],
    content: EMPTY_DOC,
    editable: false,
    editorProps: {
      attributes: {
        class:
          'text-body-text text-sm font-merriweather focus:outline-none [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted-fill/50 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_a]:underline [&_a]:text-[var(--tertiary)]',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    try {
      editor.commands.setContent(parsed, false)
    } catch {
      // If content fails (e.g. schema mismatch), leave as empty or keep previous
    }
  }, [editor, parsed])

  if (!editor) return null

  return <EditorContent editor={editor} />
}
