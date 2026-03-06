import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Maximize2, Minimize2 } from 'lucide-react';

interface RichAnnouncementEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const isHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value || '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toEditorContent = (value: string) => {
  if (!value) return '<p></p>';
  if (isHtml(value)) return value;

  const blocks = value
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`);

  return blocks.length ? blocks.join('') : '<p></p>';
};

const RichAnnouncementEditor: React.FC<RichAnnouncementEditorProps> = ({ value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEditorClass = (expanded: boolean) =>
    expanded
      ? 'min-h-[52vh] max-h-[72vh] overflow-y-auto custom-scrollbar rounded-b-lg border border-slate-300 dark:border-gray-600 border-t-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none'
      : 'min-h-[180px] max-h-[260px] overflow-y-auto custom-scrollbar rounded-b-lg border border-slate-300 dark:border-gray-600 border-t-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Image,
    ],
    content: toEditorContent(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: getEditorClass(false),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = toEditorContent(value);
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: getEditorClass(isExpanded),
        },
      },
    });
  }, [editor, isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  if (!editor) return null;

  const toolbarBtn = (active: boolean) =>
    `px-2 py-1 rounded text-xs border transition-colors ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700'
    }`;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className={isExpanded ? 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 sm:p-6' : ''}>
      <div className={isExpanded ? 'w-full max-w-5xl overflow-hidden rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-2xl' : 'rounded-lg overflow-hidden'}>
        <div className="flex flex-wrap items-center gap-1 border border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 p-1.5">
        <button type="button" className={toolbarBtn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Numbered
        </button>
        <button type="button" className={toolbarBtn(editor.isActive('link'))} onClick={setLink}>
          Link
        </button>
        <button type="button" className={toolbarBtn(false)} onClick={addImage}>
          Embed Image
        </button>
        <button
          type="button"
          className={toolbarBtn(false)}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Collapse editor' : 'Expand editor'}
          title={isExpanded ? 'Collapse editor' : 'Expand editor'}
        >
          {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichAnnouncementEditor;
