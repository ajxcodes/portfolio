'use client';

import { 
  MDXEditor, 
  headingsPlugin, 
  quotePlugin, 
  listsPlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin, 
  linkPlugin, 
  linkDialogPlugin, 
  imagePlugin, 
  tablePlugin, 
  frontmatterPlugin, 
  codeBlockPlugin, 
  codeMirrorPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  toolbarPlugin, 
  CreateLink, 
  InsertImage, 
  BlockTypeSelect, 
  InsertTable,
  ListsToggle
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabaseBrowser';

interface WysiwygEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export default function WysiwygEditor({ markdown, onChange }: WysiwygEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";
      const headers: Record<string, string> = {};
      
      if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH !== "true") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }
      
      const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Media upload failed');
      }
      
      const data = await res.json();
      return data.url || data.Url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
      throw err;
    }
  };

  return (
    <div className="w-full relative">
      {error && (
        <div className="absolute -top-12 left-0 right-0 bg-red-500/10 text-red-500 border border-red-500/20 p-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none border border-primary/20 rounded-md bg-background overflow-hidden focus-within:border-primary/50 transition-colors">
        <MDXEditor
          markdown={markdown}
          onChange={onChange}
          className={`min-h-[400px] w-full ${mounted && resolvedTheme === 'dark' ? 'dark-theme dark-editor' : ''}`}
          plugins={[
            headingsPlugin(),
            quotePlugin(),
            listsPlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin({
              imageUploadHandler: handleImageUpload,
              imagePreviewHandler: (src) => Promise.resolve(src)
            }),
            tablePlugin(),
            frontmatterPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
            codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', ts: 'TypeScript', cs: 'C#' } }),
            toolbarPlugin({
              toolbarContents: () => (
                <div className="custom-mdx-toolbar flex flex-wrap items-center gap-1 border-b border-primary/20 bg-card p-2">
                  <UndoRedo />
                  <div className="w-px h-6 bg-primary/20 mx-1"></div>
                  <BoldItalicUnderlineToggles />
                  <div className="w-px h-6 bg-primary/20 mx-1"></div>
                  <BlockTypeSelect />
                  <div className="w-px h-6 bg-primary/20 mx-1"></div>
                  <ListsToggle />
                  <div className="w-px h-6 bg-primary/20 mx-1"></div>
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                </div>
              )
            })
          ]}
        />
      </div>
    </div>
  );
}
