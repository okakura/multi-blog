import React, { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import ImageUpload from './ImageUpload'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Type,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your content...',
  minHeight = '300px',
  className = '',
}) => {
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 hover:text-purple-700 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      Color,
      TextStyle,
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 px-1 rounded',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none focus:outline-none px-4 py-3 ${className}`,
        style: `min-height: ${minHeight}`,
      },
    },
  })

  const addImage = useCallback(
    (url: string) => {
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    },
    [editor]
  )

  const openImageUpload = useCallback(() => {
    setIsImageUploadOpen(true)
  }, [])

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className={`w-full border border-slate-300 rounded-lg ${className}`}>
        <div className='flex items-center justify-center p-8 text-slate-500'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600'></div>
          <span className='ml-2'>Loading editor...</span>
        </div>
      </div>
    )
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? 'bg-purple-100 text-purple-700 border-purple-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'border border-transparent hover:border-slate-200'
      }`}>
      {children}
    </button>
  )

  return (
    <div
      className={`w-full border border-slate-300 rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className='border-b border-slate-200 p-3'>
        <div className='flex flex-wrap items-center gap-1'>
          {/* Text Formatting */}
          <div className='flex items-center gap-1 pr-2 border-r border-slate-200'>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title='Bold'>
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title='Italic'>
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title='Strikethrough'>
              <Strikethrough size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title='Inline Code'>
              <Code size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title='Highlight'>
              <Highlighter size={16} />
            </ToolbarButton>
          </div>

          {/* Headings */}
          <div className='flex items-center gap-1 pr-2 border-r border-slate-200'>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive('heading', { level: 1 })}
              title='Heading 1'>
              <Type size={16} className='font-bold' />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              title='Heading 2'>
              <Type size={14} className='font-semibold' />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive('heading', { level: 3 })}
              title='Heading 3'>
              <Type size={12} className='font-medium' />
            </ToolbarButton>
          </div>

          {/* Lists and Quotes */}
          <div className='flex items-center gap-1 pr-2 border-r border-slate-200'>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title='Bullet List'>
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title='Numbered List'>
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title='Quote'>
              <Quote size={16} />
            </ToolbarButton>
          </div>

          {/* Alignment */}
          <div className='flex items-center gap-1 pr-2 border-r border-slate-200'>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title='Align Left'>
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign('center').run()
              }
              isActive={editor.isActive({ textAlign: 'center' })}
              title='Align Center'>
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title='Align Right'>
              <AlignRight size={16} />
            </ToolbarButton>
          </div>

          {/* Media and Links */}
          <div className='flex items-center gap-1 pr-2 border-r border-slate-200'>
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive('link')}
              title='Add Link'>
              <LinkIcon size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={openImageUpload} title='Add Image'>
              <ImageIcon size={16} />
            </ToolbarButton>
          </div>

          {/* Undo/Redo */}
          <div className='flex items-center gap-1'>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title='Undo'>
              <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title='Redo'>
              <Redo size={16} />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className='relative'>
        <EditorContent editor={editor} className='prose-editor' />
        {!content && (
          <div className='absolute top-3 left-4 text-slate-500 pointer-events-none'>
            {placeholder}
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      <ImageUpload
        isOpen={isImageUploadOpen}
        onImageSelect={addImage}
        onClose={() => setIsImageUploadOpen(false)}
      />
    </div>
  )
}

export default RichTextEditor
