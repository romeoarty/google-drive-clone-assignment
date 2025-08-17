"use client";

import React, { useState, useCallback } from "react";
import { useFiles } from "@/contexts/FilesContext";
import { useToast } from "@/components/ui";
import { IFile, IFolder } from "@/lib/models";
import {
  Folder,
  File as FileIcon,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  MoreVertical,
  Download,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import {
  formatFileSize,
  getFileTypeCategory,
  isPreviewable,
} from "@/lib/clientUtils";

interface FileGridProps {
  files: IFile[];
  folders: IFolder[];
  onPreview: (file: IFile) => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  item: (IFile | IFolder) & { type: "file" | "folder" };
  onClose: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("text")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return FileIcon;
};

const getFileIconColor = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "text-green-500";
  if (mimeType.startsWith("video/")) return "text-red-500";
  if (mimeType.startsWith("audio/")) return "text-purple-500";
  if (mimeType.includes("pdf")) return "text-red-600";
  if (mimeType.includes("text")) return "text-gray-600";
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return "text-yellow-600";
  return "text-gray-500";
};

const ContextMenu: React.FC<
  ContextMenuProps & { onPreview: (file: IFile) => void }
> = ({ isOpen, position, item, onClose, onPreview }) => {
  const { deleteFile, deleteFolder, renameFile, renameFolder } = useFiles();
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);

  const handleDownload = useCallback(() => {
    if (item.type === "file") {
      window.open(`/api/files/${item._id}/download`, "_blank");
    }
    onClose();
  }, [item, onClose]);

  const handleRename = useCallback(() => {
    const newName = prompt(`Enter new name for ${item.name}:`, item.name);
    if (newName && newName.trim() !== item.name) {
      setIsRenaming(true);
      const renameAction =
        item.type === "file"
          ? renameFile(item._id, newName.trim())
          : renameFolder(item._id, newName.trim());

      renameAction.then((result) => {
        if (result.success) {
          toast(
            `${item.type === "file" ? "File" : "Folder"} renamed successfully`,
            "success"
          );
        } else {
          toast(result.error || "Failed to rename", "error");
        }
        setIsRenaming(false);
      });
    }
    onClose();
  }, [item, renameFile, renameFolder, toast, onClose]);

  const handleDelete = useCallback(() => {
    const confirmMessage = `Are you sure you want to delete "${item.name}"?`;
    if (window.confirm(confirmMessage)) {
      const deleteAction =
        item.type === "file" ? deleteFile(item._id) : deleteFolder(item._id);

      deleteAction.then((result) => {
        if (result.success) {
          toast(
            `${item.type === "file" ? "File" : "Folder"} deleted successfully`,
            "success"
          );
        } else {
          toast(result.error || "Failed to delete", "error");
        }
      });
    }
    onClose();
  }, [item, deleteFile, deleteFolder, toast, onClose]);

  const handlePreview = useCallback(() => {
    if (item.type === "file" && isPreviewable((item as IFile).mimeType)) {
      onPreview(item as IFile);
    }
    onClose();
  }, [item, onClose, onPreview]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        className="context-menu"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {item.type === "file" && isPreviewable((item as IFile).mimeType) && (
          <button className="context-menu-item" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-3" />
            Preview
          </button>
        )}

        {item.type === "file" && (
          <button className="context-menu-item" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-3" />
            Download
          </button>
        )}

        <button
          className="context-menu-item"
          onClick={handleRename}
          disabled={isRenaming}
        >
          <Edit2 className="h-4 w-4 mr-3" />
          Rename
        </button>

        <button className="context-menu-item danger" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-3" />
          Delete
        </button>
      </div>
    </>
  );
};

export default function FileGrid({ files, folders, onPreview }: FileGridProps) {
  const { navigateToFolder } = useFiles();
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: ((IFile | IFolder) & { type: "file" | "folder" }) | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const handleItemClick = useCallback(
    (item: IFile | IFolder, type: "file" | "folder") => {
      if (type === "folder") {
        navigateToFolder(item._id);
      } else {
        // For files, open preview modal
        onPreview(item as IFile);
      }
    },
    [navigateToFolder, onPreview]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: IFile | IFolder, type: "file" | "folder") => {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        item: { ...item, type },
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      item: null,
    });
  }, []);

  // Combine and sort items
  const allItems = [
    ...folders.map((folder) => ({ ...folder, type: "folder" as const })),
    ...files.map((file) => ({ ...file, type: "file" as const })),
  ];

  return (
    <div className="p-6">
      <div className="file-grid">
        {allItems.map((item) => {
          const isFolder = item.type === "folder";
          const IconComponent = isFolder
            ? Folder
            : getFileIcon((item as IFile).mimeType);
          const iconColor = isFolder
            ? "text-blue-500"
            : getFileIconColor((item as IFile).mimeType);

          return (
            <div
              key={`${item.type}-${item._id}`}
              className="file-item bg-white rounded-lg border border-gray-200 p-4 cursor-pointer group"
              onClick={() => handleItemClick(item, item.type)}
              onContextMenu={(e) => handleContextMenu(e, item, item.type)}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <IconComponent className={`h-12 w-12 ${iconColor}`} />
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 truncate-2-lines mb-1">
                  {isFolder ? item.name : (item as IFile).originalName}
                </h3>

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  {isFolder ? (
                    <p>Folder</p>
                  ) : (
                    <>
                      <p>{getFileTypeCategory((item as IFile).mimeType)}</p>
                      <p>{formatFileSize((item as IFile).size)}</p>
                    </>
                  )}
                  <p>{new Date(item.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* More options button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item, item.type);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu.item && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          item={contextMenu.item}
          onClose={closeContextMenu}
          onPreview={onPreview}
        />
      )}
    </div>
  );
}
