import { useMemo, useState } from "react";

export function useDropFiles(onFiles: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useMemo(() => {
    return {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const list = Array.from(e.dataTransfer?.files ?? []);
        if (list.length) onFiles(list);
      },
    };
  }, [onFiles]);

  return { isDragging, handlers };
}






