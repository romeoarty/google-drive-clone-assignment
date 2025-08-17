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
import { RenameModal, DeleteConfirmModal } from "@/components/ui";

interface FileListProps {
  files: IFile[];
  folders: IFolder[];
  onPreview: (file: IFile) => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  item: (IFile | IFolder) & { type: "file" | "folder" };
  onClose: () => void;
  onPreview: (file: IFile) => void;
  onShowRenameModal: (item: (IFile | IFolder) & { type: "file" | "folder" }) => void;
  onShowDeleteModal: (item: (IFile | IFolder) & { type: "file" | "folder" }) => void;
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

export const FileListContextMenu: React.FC<ContextMenuProps> = ({
  item,
  isOpen,
  position,
  onClose,
  onPreview,
  onShowRenameModal,
  onShowDeleteModal,
}) => {
  const { renameFile, renameFolder, deleteFile, deleteFolder } = useFiles();
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = useCallback(() => {
    if (item.type === "file") {
      window.open(`/api/files/${item._id}/download`, "_blank");
    }
    onClose();
  }, [item, onClose]);

  const handleRename = useCallback(() => {
    onShowRenameModal(item);
    onClose();
  }, [item, onShowRenameModal, onClose]);

  const handleDelete = useCallback(() => {
    onShowDeleteModal(item);
    onClose();
  }, [item, onShowDeleteModal, onClose]);

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

export default function FileList({ files, folders, onPreview }: FileListProps) {
  const { navigateToFolder, renameFile, renameFolder, deleteFile, deleteFolder } = useFiles();
  const { toast } = useToast();
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: ((IFile | IFolder) & { type: "file" | "folder" }) | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  // Modal states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalItem, setModalItem] = useState<((IFile | IFolder) & { type: "file" | "folder" }) | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShowRenameModal = useCallback((item: (IFile | IFolder) & { type: "file" | "folder" }) => {
    setModalItem(item);
    setShowRenameModal(true);
  }, []);

  const handleShowDeleteModal = useCallback((item: (IFile | IFolder) & { type: "file" | "folder" }) => {
    setModalItem(item);
    setShowDeleteModal(true);
  }, []);

  const handleRenameSubmit = useCallback((newName: string) => {
    if (!modalItem) return;
    
    setIsRenaming(true);
    const renameAction =
      modalItem.type === "file"
        ? renameFile(modalItem._id, newName)
        : renameFolder(modalItem._id, newName);

    renameAction.then((result) => {
      if (result.success) {
        toast(
          `${modalItem.type === "file" ? "File" : "Folder"} renamed successfully`,
          "success"
        );
        setShowRenameModal(false);
      } else {
        toast(result.error || "Failed to rename", "error");
      }
      setIsRenaming(false);
    });
  }, [modalItem, renameFile, renameFolder, toast]);

  const handleDeleteSubmit = useCallback(() => {
    if (!modalItem) return;
    
    setIsDeleting(true);
    const deleteAction =
      modalItem.type === "file" ? deleteFile(modalItem._id) : deleteFolder(modalItem._id);

    deleteAction.then((result) => {
      if (result.success) {
        toast(
          `${modalItem.type === "file" ? "File" : "Folder"} deleted successfully`,
          "success"
        );
        setShowDeleteModal(false);
      } else {
        toast(result.error || "Failed to delete", "error");
      }
      setIsDeleting(false);
    });
  }, [modalItem, deleteFile, deleteFolder, toast]);

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
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Context menu dimensions (approximate)
      const menuWidth = 160; // matches CSS min-width
      const menuHeight = 200; // approximate height
      
      // Calculate adjusted position to keep menu within viewport
      let adjustedX = e.clientX;
      let adjustedY = e.clientY;
      
      // Adjust horizontal position if menu would go off right edge
      if (e.clientX + menuWidth > viewportWidth) {
        adjustedX = e.clientX - menuWidth;
      }
      
      // Adjust vertical position if menu would go off bottom edge
      if (e.clientY + menuHeight > viewportHeight) {
        adjustedY = e.clientY - menuHeight;
      }
      
      // Ensure menu doesn't go off left edge
      if (adjustedX < 0) {
        adjustedX = 10;
      }
      
      // Ensure menu doesn't go off top edge
      if (adjustedY < 0) {
        adjustedY = 10;
      }
      
      setContextMenu({
        isOpen: true,
        position: { x: adjustedX, y: adjustedY },
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
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-opacity"
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
        <FileListContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          item={contextMenu.item}
          onClose={closeContextMenu}
          onPreview={onPreview}
          onShowRenameModal={handleShowRenameModal}
          onShowDeleteModal={handleShowDeleteModal}
        />
      )}

      {/* Rename Modal */}
      {modalItem && (
        <RenameModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          currentName={modalItem.type === "file" ? (modalItem as IFile).originalName : modalItem.name}
          onRename={handleRenameSubmit}
          title={`Rename ${modalItem.type === "file" ? "File" : "Folder"}`}
          itemType={modalItem.type}
          isLoading={isRenaming}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modalItem && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemName={modalItem.type === "file" ? (modalItem as IFile).originalName : modalItem.name}
          onDelete={handleDeleteSubmit}
          itemType={modalItem.type}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
