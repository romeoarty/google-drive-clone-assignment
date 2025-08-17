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
      const shouldClose = window.confirm(
        "Are you sure you want to close? Your changes will be lost."
      );
      if (shouldClose) {
        onClose();
      }
    } else if (!isCreating) {
      onClose();
    }
  }, [folderName, isCreating, onClose]);

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
  );
}
