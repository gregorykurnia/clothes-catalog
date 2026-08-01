"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cloudinaryPreview } from "@/lib/cloudinary";

async function shareItemPhoto(photoUrl: string, name: string) {
  try {
    const response = await fetch(photoUrl);
    const blob = await response.blob();
    const file = new File([blob], `${name}.jpg`, { type: blob.type || "image/jpeg" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }

    if (navigator.share) {
      await navigator.share({ title: name, url: photoUrl });
      return;
    }

    toast.error("Sharing isn't supported on this device");
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    toast.error("Failed to share photo");
  }
}

export function PhotoLightbox({
  photoUrl,
  name,
  children,
}: {
  photoUrl: string;
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in"
        aria-label={`View ${name} photo`}
      >
        {children}
      </button>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogTitle>{name}</DialogTitle>
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={cloudinaryPreview(photoUrl, 1000)}
            alt={name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => shareItemPhoto(photoUrl, name)}
        >
          <Share2 className="h-4 w-4" />
          Share on WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
