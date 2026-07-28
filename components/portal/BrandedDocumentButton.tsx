'use client';

import { FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { download } from '@/workbench/export/download';

/**
 * The branded review document. "Open to print" is the primary action because
 * the artifact people actually circulate is a PDF, and every browser can make
 * one from this page — no PDF library, no server-side rendering, and the output
 * carries the workspace's own logo and colour.
 */
export function BrandedDocumentButton({
  html,
  fileName,
}: {
  html: string;
  fileName: string;
}) {
  function openForPrint() {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Your browser blocked the document window. Allow pop-ups for this site.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={openForPrint}
        className="inline-flex items-center gap-2 rounded-md bg-electric px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        <Printer className="h-4 w-4" /> Open branded document (print / save as PDF)
      </button>
      <button
        onClick={() => {
          download(fileName, 'text/html', html);
          toast.success(`Downloaded ${fileName}`);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-electric/50"
      >
        <FileText className="h-4 w-4" /> Download .html
      </button>
    </div>
  );
}
