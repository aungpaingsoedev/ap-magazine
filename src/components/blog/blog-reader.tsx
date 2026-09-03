'use client';

import type { JSONContent } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import type { RichTextDocument } from '@/lib/db/schema';

type BlogReaderProps = {
  content: RichTextDocument;
};

export function BlogReader({ content }: BlogReaderProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto my-8 grayscale',
        },
      }),
    ],
    content: content as JSONContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-neutral-950',
      },
    },
  });

  return <EditorContent editor={editor} />;
}
