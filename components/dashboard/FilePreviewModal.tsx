"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, LoadingSpinner, useToast, RenameModal, DeleteConfirmModal } from "@/components/ui";
import { IFile } from "@/lib/models";
import {
  Download,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File as FileIcon,
  Calendar,
  HardDrive,
  User,
  Hash,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import {
  formatFileSize,
  getFileTypeCategory,
  isPreviewable,
} from "@/lib/clientUtils";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: IFile | null;
  onRename?: (
    fileId: string,
    newName: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (fileId: string) => Promise<{ success: boolean; error?: string }>;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon;
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

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onRename,
  onDelete,
}: FilePreviewModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // URLs for different purposes
  const downloadUrl = file ? `/api/files/${file._id}/download` : "";
  const previewUrl = file ? `/api/files/${file._id}/preview` : "";

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPreviewError(null);
      setImageZoom(1);
      setImageRotation(0);
    }
  }, [isOpen, file]);

  const handleDownload = useCallback(() => {
    if (file) {
      window.open(downloadUrl, "_blank");
    }
  }, [file, downloadUrl]);

  const handleRename = useCallback(() => {
    setShowRenameModal(true);
  }, []);

  const handleRenameSubmit = useCallback(async (newName: string) => {
    if (!file || !onRename) return;

    setIsRenaming(true);
    try {
      const result = await onRename(file._id, newName);
      if (result.success) {
        toast("File renamed successfully", "success");
        setShowRenameModal(false);
      } else {
        toast(result.error || "Failed to rename file", "error");
      }
    } catch (error) {
      toast("Failed to rename file", "error");
    } finally {
      setIsRenaming(false);
    }
  }, [file, onRename, toast]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteSubmit = useCallback(async () => {
    if (!file || !onDelete) return;

    setIsDeleting(true);
    try {
      const result = await onDelete(file._id);
      if (result.success) {
        toast("File deleted successfully", "success");
        setShowDeleteModal(false);
        onClose();
      } else {
        toast(result.error || "Failed to delete file", "error");
      }
    } catch (error) {
      toast("Failed to delete file", "error");
    } finally {
      setIsDeleting(false);
    }
  }, [file, onDelete, toast, onClose]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setPreviewError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setPreviewError("Failed to load image preview");
  }, []);

  const handleZoomIn = useCallback(() => {
    setImageZoom((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom((prev) => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setImageRotation((prev) => (prev + 90) % 360);
  }, []);

  const renderPreviewContent = () => {
    if (!file) return null;

    // Image preview
    if (file.mimeType.startsWith("image/")) {
      return (
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {previewError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-gray-600">{previewError}</p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center p-4"
              style={{ minHeight: "400px" }}
            >
              <img
                src={previewUrl}
                alt={file.originalName}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                }}
              />
            </div>
          )}

          {/* Image controls */}
          {file.mimeType.startsWith("image/") && !previewError && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-lg px-4 py-2 flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="text-white hover:text-gray-300 p-1"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-white text-sm px-2">
                {Math.round(imageZoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="text-white hover:text-gray-300 p-1"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-500 mx-2" />
              <button
                onClick={handleRotate}
                className="text-white hover:text-gray-300 p-1"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // PDF preview
    if (file.mimeType === "application/pdf") {
      return (
        <div
          className="bg-gray-100 rounded-lg overflow-hidden relative"
          style={{ height: "500px" }}
        >
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&embedded=true`}
            className="w-full h-full border-0"
            title={`PDF Preview: ${file.originalName}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setPreviewError("Failed to load PDF preview");
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Fallback message for PDFs that can't be displayed */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
            <p>PDF Preview</p>
            <p className="text-xs opacity-75">
              If preview doesn&apos;t work, use download button
            </p>
          </div>
        </div>
      );
    }

    // Text file preview
    if (
      file.mimeType.startsWith("text/") ||
      file.mimeType === "application/json"
    ) {
      return (
        <div className="bg-gray-50 rounded-lg p-4" style={{ height: "400px" }}>
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white rounded"
            title={`Text Preview: ${file.originalName}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setPreviewError("Failed to load text preview");
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      );
    }

    // File info for non-previewable files
    const IconComponent = getFileIcon(file.mimeType);
    const iconColor = getFileIconColor(file.mimeType);

    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <IconComponent className={`h-20 w-20 mx-auto ${iconColor} mb-4`} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {file.originalName}
          </h3>
          <p className="text-gray-600">
            This file type cannot be previewed in the browser
          </p>
        </div>

        <Button onClick={handleDownload} className="mb-4">
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  const renderFileInfo = () => {
    if (!file) return null;

    const IconComponent = getFileIcon(file.mimeType);
    const iconColor = getFileIconColor(file.mimeType);

    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          File Information
        </h3>

        <div className="space-y-4">
          {/* File icon and name */}
          <div className="flex items-center">
            <IconComponent className={`h-8 w-8 ${iconColor} mr-3`} />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {file.originalName}
              </p>
              <p className="text-xs text-gray-500">
                {getFileTypeCategory(file.mimeType)}
              </p>
            </div>
          </div>

          {/* File details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <HardDrive className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">File Size</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">File Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {file.mimeType}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Modified</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(file.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Hash className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">File ID</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {file._id.slice(-8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Eye className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Previewable</p>
                <p className="text-sm font-medium text-gray-900">
                  {isPreviewable(file.mimeType) ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!file) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={file.originalName}
        size="xl"
      >
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {onRename && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRename}
                  loading={isRenaming}
                  disabled={isRenaming}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {getFileTypeCategory(file.mimeType)}
            </div>
          </div>

          {/* Preview content */}
          <div className="relative">{renderPreviewContent()}</div>

          {/* File information */}
          {renderFileInfo()}
        </div>
      </Modal>

      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        currentName={file?.originalName || ""}
        onRename={handleRenameSubmit}
        title="Rename File"
        itemType="file"
        isLoading={isRenaming}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={file?.originalName || ""}
        onDelete={handleDeleteSubmit}
        itemType="file"
        isLoading={isDeleting}
      />
    </>
  );
}
