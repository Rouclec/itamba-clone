'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import { useCallback, useEffect, useMemo } from 'react'
import { Bold, Italic, List, ListOrdered, Quote, Link } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

function parseInitialContent(json: string | undefined): object {
  if (!json?.trim() || json.trim() === '{}') return EMPTY_DOC
  try {
    const parsed = JSON.parse(json) as object
    if (parsed && typeof parsed === 'object' && 'type' in parsed) return parsed
  } catch {
    // ignore
  }
  return EMPTY_DOC
}

const editorContentClass =
  'text-body-text text-sm min-h-[100px] px-3 py-2 focus:outline-none max-w-none [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:underline [&_a]:text-primary'

export interface DocumentRichTextBlockProps {
  value?: string
  onChange?: (json: string) => void
  label: string
  className?: string
  required?: boolean
}

export function DocumentRichTextBlock({
  value,
  onChange,
  label,
  className,
  required,
}: DocumentRichTextBlockProps) {
  const initialContent = useMemo(() => parseInitialContent(value), [value])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: initialContent,
    editable: true,
    editorProps: {
      attributes: {
        class: editorContentClass,
      },
    },
  })

  useEffect(() => {
    if (!editor || !onChange) return
    const onUpdate = () => {
      const json = editor.getJSON()
      onChange(JSON.stringify(json ?? EMPTY_DOC))
    }
    editor.on('transaction', onUpdate)
    return () => editor.off('transaction', onUpdate)
  }, [editor, onChange])

  const setLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Link URL', editor.getAttributes('link').href || 'https://')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const btn = 'rounded p-1.5 text-body-text hover:bg-hover transition-colors'
  const btnActive = 'bg-primary/20 text-primary ring-1 ring-inset ring-primary/40'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="rounded-md border border-border bg-background overflow-hidden">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted-fill/50 p-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(btn, editor.isActive('bold') && btnActive)}
            aria-label="Bold"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(btn, editor.isActive('italic') && btnActive)}
            aria-label="Italic"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(btn, editor.isActive('bulletList') && btnActive)}
            aria-label="Bullet list"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(btn, editor.isActive('orderedList') && btnActive)}
            aria-label="Ordered list"
          >
            <ListOrdered className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(btn, editor.isActive('blockquote') && btnActive)}
            aria-label="Quote"
          >
            <Quote className="size-4" />
          </button>
          <button
            type="button"
            onClick={setLink}
            className={cn(btn, editor.isActive('link') && btnActive)}
            aria-label="Link"
          >
            <Link className="size-4" />
          </button>
        </div>
        <EditorContent editor={editor} aria-label={label} />
      </div>
    </div>
  )
}
