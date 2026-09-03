'use client';

import { useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RichTextDocument } from '@/lib/db/schema';
import { MediaPicker } from '@/components/admin/media-picker';

type RichTextEditorProps = {
  value?: RichTextDocument;
  onChange?: (doc: RichTextDocument) => void;
  className?: string;
  enableMediaLibrary?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  className,
  enableMediaLibrary = false,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'underline' },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto my-4 grayscale',
        },
      }),
    ],
    content: (value ?? { type: 'doc', content: [] }) as JSONContent,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON() as RichTextDocument);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-neutral max-w-none min-h-[280px] p-4 focus:outline-none',
      },
    },
  });

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? 'Failed to upload image');
      event.target.value = '';
      return;
    }

    const { url } = (await response.json()) as { url: string };
    editor.chain().focus().setImage({ src: url }).run();
    event.target.value = '';
  }

  function addLink() {
    const previous = editor?.getAttributes('link').href as string | undefined;
    const href = window.prompt('Link URL', previous ?? 'https://');
    if (href === null) return;
    if (href === '') {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    editor?.chain().focus().setLink({ href }).run();
  }

  function setImageCaption() {
    const alt = window.prompt('Image caption / alt text', editor?.getAttributes('image').alt ?? '');
    if (alt === null) return;
    editor?.chain().focus().updateAttributes('image', { alt }).run();
  }

  return (
    <div
      className={cn(
        'overflow-hidden border border-neutral-300 bg-white',
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 p-2">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })}>
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
          B
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
          I
        </ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor?.isActive('link')}>
          Link
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
          List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
          1.
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>
          Quote
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          —
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')}>
          Code
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        {enableMediaLibrary ? (
          <ToolbarButton onClick={() => setLibraryOpen(true)}>Library</ToolbarButton>
        ) : null}
        <ToolbarButton onClick={setImageCaption}>Caption</ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      <EditorContent editor={editor} />
      {enableMediaLibrary ? (
        <MediaPicker
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => editor?.chain().focus().setImage({ src: url }).run()}
        />
      ) : null}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 text-xs font-medium',
        active
          ? 'bg-neutral-950 text-white'
          : 'bg-white text-neutral-700 hover:bg-neutral-100',
      )}
    >
      {children}
    </button>
  );
}
