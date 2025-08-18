"use client";

import React, { useState, useCallback, useRef } from "react";
import { useFiles } from "@/contexts/FilesContext";
import { Modal, Button, useToast } from "@/components/ui";
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react";
import { formatFileSize, validateFileUpload } from "@/lib/clientUtils";

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress?: number;
}

export default function FileUpload({ isOpen, onClose }: FileUploadProps) {
  const { uploadFile, currentFolder } = useFiles();
  const { toast } = useToast();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map((file) => {
      const validation = validateFileUpload({
        size: file.size,
        type: file.type,
        name: file.name,
      });

      return {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: validation.isValid ? "pending" : "error",
        error: validation.isValid ? undefined : validation.error,
      };
    });

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      addFiles(files);
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const uploadFileItem of pendingFiles) {
      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? { ...f, status: "uploading", progress: 0 }
            : f
        )
      );

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFileItem.id && f.status === "uploading"
                ? { ...f, progress: Math.min((f.progress || 0) + 20, 90) }
                : f
            )
          );
        }, 200);

        const result = await uploadFile(
          uploadFileItem.file,
          currentFolder?._id
        );

        clearInterval(progressInterval);

        if (result.success) {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFileItem.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          );
        } else {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFileItem.id
                ? {
                    ...f,
                    status: "error",
                    error: result.error || "Upload failed",
                  }
                : f
            )
          );
        }
      } catch {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFileItem.id
              ? { ...f, status: "error", error: "Upload failed" }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Show completion message
    const successCount = uploadFiles.filter(
      (f) => f.status === "success"
    ).length;
    const errorCount = uploadFiles.filter((f) => f.status === "error").length;

    if (successCount > 0 && errorCount === 0) {
      toast(
        `Successfully uploaded ${successCount} file${
          successCount > 1 ? "s" : ""
        }`,
        "success"
      );
    } else if (successCount > 0 && errorCount > 0) {
      toast(`Uploaded ${successCount} files, ${errorCount} failed`, "info");
    } else if (errorCount > 0) {
      toast(
        `Failed to upload ${errorCount} file${errorCount > 1 ? "s" : ""}`,
        "error"
      );
    }
  }, [uploadFiles, uploadFile, currentFolder, toast]);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      setUploadFiles([]);
      onClose();
    }
  }, [isUploading, onClose]);

  const canUpload =
    uploadFiles.some((f) => f.status === "pending") && !isUploading;
  const hasCompletedUploads = uploadFiles.some(
    (f) => f.status === "success" || f.status === "error"
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Files" size="lg">
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`dropzone ${isDragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Choose files or drag them here
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supports images, documents, and other file types up to 4MB
          </p>
          <Button variant="outline">Browse Files</Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Files to Upload ({uploadFiles.length})
            </h3>

            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
              {uploadFiles.map((uploadFileItem) => (
                <div
                  key={uploadFileItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {uploadFileItem.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : uploadFileItem.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFileItem.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFileItem.file.size)}
                        </p>
                        {uploadFileItem.status === "error" &&
                          uploadFileItem.error && (
                            <p className="text-xs text-red-600">
                              {uploadFileItem.error}
                            </p>
                          )}
                      </div>

                      {/* Progress bar */}
                      {uploadFileItem.status === "uploading" && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadFileItem.progress || 0}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {uploadFileItem.status === "pending" && (
                    <button
                      onClick={() => removeFile(uploadFileItem.id)}
                      className="ml-3 text-gray-400 hover:text-gray-600"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {hasCompletedUploads ? "Done" : "Cancel"}
          </Button>

          {canUpload && (
            <Button
              onClick={uploadAllFiles}
              loading={isUploading}
              disabled={!canUpload}
            >
              Upload {uploadFiles.filter((f) => f.status === "pending").length}{" "}
              File
              {uploadFiles.filter((f) => f.status === "pending").length !== 1
                ? "s"
                : ""}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
