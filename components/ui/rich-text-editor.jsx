'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEditor, EditorContent } from '@tiptap/react'
import { useState, useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
// import Color from '@tiptap/extension-color'
// import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon,
  Highlighter,
  Palette,
  RotateCcw,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  // const setColor = (color) => {
  //   editor.chain().focus().setColor(color).run()
  // }

  const setHighlight = (color) => {
    editor.chain().focus().setHighlight({ color }).run()
  }

  return (
    <div className="border-b border-white/20 bg-white/5 p-2 rounded-t-lg">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().undo().run()
            }}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().redo().run()
            }}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleBold().run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('bold') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleItalic().run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('italic') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleUnderline().run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('underline') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleBulletList().run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('bulletList') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().toggleOrderedList().run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('orderedList') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Text alignment */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().setTextAlign('left').run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive({ textAlign: 'left' }) && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().setTextAlign('center').run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive({ textAlign: 'center' }) && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().setTextAlign('right').run()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive({ textAlign: 'right' }) && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Colors - Temporarily disabled */}
        {/* <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColor('#E2FF1B')}
            className="h-8 w-8 p-0 bg-[#E2FF1B] hover:bg-[#E2FF1B]/80"
            title="Color amarillo"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColor('#10B981')}
            className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
            title="Color verde"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColor('#3B82F6')}
            className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
            title="Color azul"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColor('#EF4444')}
            className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600"
            title="Color rojo"
          />
        </div> */}

        {/* Highlight */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setHighlight('#FEF3C7')
            }}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
            title="Resaltar amarillo"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addLink()
            }}
            className={cn(
              "h-8 w-8 p-0 text-white hover:bg-white/10",
              editor.isActive('link') && "bg-[#E2FF1B]/20 text-[#E2FF1B]"
            )}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editor.chain().focus().unsetLink().run()
            }}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
            disabled={!editor.isActive('link')}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Clear all */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
                editor.chain().focus().clearContent().run()
              }
            }}
            className="h-8 px-3 text-white hover:bg-red-500/20 hover:text-red-400 text-xs"
            title="Limpiar todo el contenido"
          >
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  )
}

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Escribe aquí...',
  className = '',
  minHeight = '200px'
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#E2FF1B] underline hover:text-[#E2FF1B]/80',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  // Actualizar el contenido cuando cambie el valor desde las props
  useEffect(() => {
    if (editor && mounted && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor, mounted])

  // Atajos de teclado para Undo/Redo
  useEffect(() => {
    if (!editor || !mounted) return

    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          editor.chain().focus().redo().run()
        } else {
          editor.chain().focus().undo().run()
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault()
        editor.chain().focus().redo().run()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor, mounted])

  // Mostrar un placeholder mientras se monta el componente
  if (!mounted) {
    return (
      <div className={cn("border border-white/20 rounded-lg overflow-hidden", className)}>
        <div className="border-b border-white/20 bg-white/5 p-2 rounded-t-lg">
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-1 border-r border-white/20 pr-2">
              <div className="h-8 w-8 bg-white/10 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-white/10 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div 
          className="bg-white/10 p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
          style={{ minHeight }}
        >
          <div className="text-gray-500 text-sm">
            {placeholder}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-white/20 rounded-lg overflow-hidden", className)}>
      <MenuBar editor={editor} />
      <div 
        className="bg-white/10 p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
        style={{ minHeight }}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-invert max-w-none"
        />
        {!editor?.getText() && (
          <div className="text-gray-500 text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

export default RichTextEditor 