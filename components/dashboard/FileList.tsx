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
  Calendar,
  HardDrive,
} from "lucide-react";
import {
  formatFileSize,
  getFileTypeCategory,
  isPreviewable,
} from "@/lib/clientUtils";

interface FileListProps {
  files: IFile[];
  folders: IFolder[];
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

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  item,
  onClose,
}) => {
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
    const currentName =
      item.type === "file" ? (item as IFile).originalName : item.name;
    const newName = prompt(`Enter new name for ${currentName}:`, currentName);
    if (newName && newName.trim() !== currentName) {
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
    const itemName =
      item.type === "file" ? (item as IFile).originalName : item.name;
    const confirmMessage = `Are you sure you want to delete "${itemName}"?`;
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
      window.open(`/api/files/${item._id}/download`, "_blank");
    }
    onClose();
  }, [item, onClose]);

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

export default function FileList({ files, folders }: FileListProps) {
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
        // For files, you could implement a preview or download action
        window.open(`/api/files/${item._id}/download`, "_blank");
      }
    },
    [navigateToFolder]
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
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-5">Name</div>
          <div className="col-span-2 sm:col-span-2 hidden sm:block">Type</div>
          <div className="col-span-2 sm:col-span-2 hidden sm:block">Size</div>
          <div className="col-span-2 sm:col-span-2 hidden md:block">
            Modified
          </div>
          <div className="col-span-2 sm:col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto custom-scrollbar">
        {allItems.map((item) => {
          const isFolder = item.type === "folder";
          const IconComponent = isFolder
            ? Folder
            : getFileIcon((item as IFile).mimeType);
          const iconColor = isFolder
            ? "text-blue-500"
            : getFileIconColor((item as IFile).mimeType);
          const displayName = isFolder
            ? item.name
            : (item as IFile).originalName;
          const fileSize = isFolder
            ? "-"
            : formatFileSize((item as IFile).size);
          const fileType = isFolder
            ? "Folder"
            : getFileTypeCategory((item as IFile).mimeType);

          return (
            <div
              key={`${item.type}-${item._id}`}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer group transition-colors"
              onClick={() => handleItemClick(item, item.type)}
              onContextMenu={(e) => handleContextMenu(e, item, item.type)}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Name with icon */}
                <div className="col-span-6 sm:col-span-5 flex items-center min-w-0">
                  <div className="flex-shrink-0 mr-3">
                    <IconComponent className={`h-6 w-6 ${iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2 sm:col-span-2 hidden sm:block">
                  <p className="text-sm text-gray-500">{fileType}</p>
                </div>

                {/* Size */}
                <div className="col-span-2 sm:col-span-2 hidden sm:flex items-center">
                  <HardDrive className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-500">{fileSize}</p>
                </div>

                {/* Modified date */}
                <div className="col-span-2 sm:col-span-2 hidden md:flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, item, item.type);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile-only additional info */}
              <div className="mt-2 sm:hidden">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{fileType}</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <HardDrive className="h-3 w-3 mr-1" />
                      {fileSize}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {allItems.length === 0 && (
        <div className="text-center py-12 bg-white">
          <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No files or folders
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a file or creating a folder.
          </p>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.item && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          item={contextMenu.item}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
