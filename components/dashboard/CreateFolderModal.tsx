"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useFiles } from "@/contexts/FilesContext";
import { Modal, Button, Input, useToast } from "@/components/ui";
import { Folder, AlertCircle } from "lucide-react";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
}: CreateFolderModalProps) {
  const { createFolder, currentFolder, folders } = useFiles();
  const { toast } = useToast();
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFolderName("");
      setError("");
      setIsCreating(false);
    }
  }, [isOpen]);

  // Validate folder name
  const validateFolderName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "Folder name is required";
      }

      if (name.trim().length > 100) {
        return "Folder name cannot exceed 100 characters";
      }

      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(name)) {
        return "Folder name contains invalid characters";
      }

      // Check for reserved names
      const reservedNames = [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9",
      ];
      if (reservedNames.includes(name.trim().toUpperCase())) {
        return "This folder name is reserved by the system";
      }

      // Check for duplicate names in current directory
      const currentParentId = currentFolder?._id || null;
      const isDuplicate = folders.some(
        (folder) =>
          folder.name.toLowerCase() === name.trim().toLowerCase() &&
          folder.parentId === currentParentId
      );

      if (isDuplicate) {
        return "A folder with this name already exists in this location";
      }

      return null;
    },
    [folders, currentFolder]
  );

  // Handle input change with real-time validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFolderName(value);

      // Clear error when user starts typing
      if (error && value.trim()) {
        setError("");
      }
    },
    [error]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = folderName.trim();
      const validationError = validateFolderName(trimmedName);

      if (validationError) {
        setError(validationError);
        return;
      }

      setIsCreating(true);
      setError("");

      try {
        const result = await createFolder(trimmedName, currentFolder?._id);

        if (result.success) {
          toast("Folder created successfully", "success");
          onClose();
        } else {
          setError(result.error || "Failed to create folder");
        }
      } catch (error) {
        console.error("Create folder error:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsCreating(false);
      }
    },
    [
      folderName,
      validateFolderName,
      createFolder,
      currentFolder,
      toast,
      onClose,
    ]
  );

  // Handle close with confirmation if form has content
  const handleClose = useCallback(() => {
    if (folderName.trim() && !isCreating) {
      setShowCloseConfirm(true);
    } else if (!isCreating) {
      onClose();
    }
  }, [folderName, isCreating, onClose]);

  const handleCloseConfirm = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  const handleCloseCancel = useCallback(() => {
    setShowCloseConfirm(false);
  }, []);

  // Generate suggested folder names
  const getSuggestedNames = useCallback((): string[] => {
    const suggestions = [
      "New Folder",
      "Documents",
      "Images",
      "Videos",
      "Projects",
      "Archive",
    ];

    return suggestions
      .filter((name) => {
        const currentParentId = currentFolder?._id || null;
        return !folders.some(
          (folder) =>
            folder.name.toLowerCase() === name.toLowerCase() &&
            folder.parentId === currentParentId
        );
      })
      .slice(0, 3);
  }, [folders, currentFolder]);

  const suggestedNames = getSuggestedNames();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Create New Folder"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current location indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Folder className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Creating folder in:
                </p>
                <p className="text-sm text-blue-700">
                  {currentFolder ? currentFolder.name : "My Drive"}
                </p>
              </div>
            </div>
          </div>

          {/* Folder name input */}
          <div>
            <Input
              label="Folder Name"
              type="text"
              value={folderName}
              onChange={handleInputChange}
              placeholder="Enter folder name"
              error={error}
              disabled={isCreating}
              autoFocus
              maxLength={100}
              icon={<Folder className="h-5 w-5 text-gray-400" />}
            />

            {/* Character counter */}
            <div className="mt-1 text-right">
              <span
                className={`text-xs ${
                  folderName.length > 80 ? "text-orange-600" : "text-gray-500"
                }`}
              >
                {folderName.length}/100 characters
              </span>
            </div>
          </div>

          {/* Suggested names */}
          {suggestedNames.length > 0 && !folderName.trim() && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFolderName(name)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    disabled={isCreating}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Validation tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Folder naming guidelines:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cannot be empty or contain only spaces</li>
                  <li>• Maximum 100 characters</li>
                  <li>• Cannot contain: &lt; &gt; : &quot; / \ | ? *</li>
                  <li>• Must be unique in this location</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={isCreating}
              disabled={isCreating || !folderName.trim() || !!error}
            >
              {isCreating ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Confirmation Modal */}
      <Modal
        isOpen={showCloseConfirm}
        onClose={handleCloseCancel}
        title="Unsaved Changes"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unsaved Changes
            </h3>
            
            <p className="text-sm text-gray-500">
              Are you sure you want to close? Your changes will be lost.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCancel}
            >
              Continue Editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleCloseConfirm}
            >
              Close Without Saving
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
