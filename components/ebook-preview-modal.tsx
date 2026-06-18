"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileX } from "lucide-react"
import type { Ebook } from "@/lib/ebooks/types"

interface EbookPreviewModalProps {
  ebook: Ebook | null
  open: boolean
  onClose: () => void
}

export function EbookPreviewModal({ ebook, open, onClose }: EbookPreviewModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-3xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b text-left">
          <DialogTitle className="truncate">{ebook?.title ?? "Ebook"}</DialogTitle>
          {ebook?.author && <p className="text-sm text-muted-foreground">{ebook.author}</p>}
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted">
          {ebook?.previewUrl ? (
            <iframe
              src={ebook.previewUrl}
              title={`Preview of ${ebook.title}`}
              className="w-full h-full border-0"
              allow="autoplay"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileX className="h-10 w-10" />
              <p>Preview unavailable for this ebook.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          {ebook?.downloadUrl && (
            <Button asChild>
              <a href={ebook.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
