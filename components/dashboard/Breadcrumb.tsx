"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFiles } from "@/contexts/FilesContext";
import { IFolder } from "@/lib/models";
import { ChevronRight, Home, Folder } from "lucide-react";

interface BreadcrumbItem {
  id: string | null;
  name: string;
  folder?: IFolder;
}

export default function Breadcrumb() {
  const { currentFolder, navigateToFolder, folders } = useFiles();
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Build breadcrumb path
  const buildBreadcrumbPath = useCallback(
    async (folder: IFolder | null): Promise<BreadcrumbItem[]> => {
      const items: BreadcrumbItem[] = [];

      // Always start with root
      items.unshift({
        id: null,
        name: "My Drive",
      });

      if (!folder) {
        return items;
      }

      // Build path by traversing up the folder hierarchy
      let currentFolderInPath: IFolder | null = folder;
      const visitedIds = new Set<string>(); // Prevent infinite loops

      while (currentFolderInPath && !visitedIds.has(currentFolderInPath._id)) {
        visitedIds.add(currentFolderInPath._id);

        items.splice(1, 0, {
          id: currentFolderInPath._id,
          name: currentFolderInPath.name,
          folder: currentFolderInPath,
        });

        // Find parent folder
        if (currentFolderInPath.parentId) {
          const parentFolder = folders.find(
            (f) => f._id === currentFolderInPath?.parentId
          );
          currentFolderInPath = parentFolder || null;
        } else {
          currentFolderInPath = null;
        }
      }

      return items;
    },
    [folders]
  );

  // Update breadcrumb when current folder changes
  useEffect(() => {
    const updateBreadcrumb = async () => {
      setIsLoading(true);
      try {
        const items = await buildBreadcrumbPath(currentFolder);
        setBreadcrumbItems(items);
      } catch (error) {
        console.error("Error building breadcrumb path:", error);
        // Fallback to basic breadcrumb
        setBreadcrumbItems([
          { id: null, name: "My Drive" },
          ...(currentFolder
            ? [
                {
                  id: currentFolder._id,
                  name: currentFolder.name,
                  folder: currentFolder,
                },
              ]
            : []),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    updateBreadcrumb();
  }, [currentFolder, buildBreadcrumbPath]);

  const handleBreadcrumbClick = useCallback(
    (folderId: string | null) => {
      navigateToFolder(folderId);
    },
    [navigateToFolder]
  );

  if (isLoading && breadcrumbItems.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="skeleton h-4 w-20"></div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <div className="skeleton h-4 w-24"></div>
      </div>
    );
  }

  return (
    <nav
      className="flex items-center space-x-2 text-sm overflow-x-auto"
      aria-label="Breadcrumb"
    >
      <div className="flex items-center space-x-2 whitespace-nowrap">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isRoot = item.id === null;

          return (
            <React.Fragment key={item.id || "root"}>
              {/* Breadcrumb item */}
              <button
                onClick={() => handleBreadcrumbClick(item.id)}
                className={`
                  flex items-center px-2 py-1 rounded-md transition-colors
                  ${
                    isLast
                      ? "text-gray-900 font-medium bg-gray-100 cursor-default"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  }
                `}
                disabled={isLast}
                aria-current={isLast ? "page" : undefined}
              >
                {isRoot ? (
                  <>
                    <Home className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-32">{item.name}</span>
                  </>
                ) : (
                  <>
                    <Folder className="h-4 w-4 mr-1 flex-shrink-0 text-blue-500" />
                    <span className="truncate max-w-32" title={item.name}>
                      {item.name}
                    </span>
                  </>
                )}
              </button>

              {/* Separator */}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Overflow indicator for mobile */}
      {breadcrumbItems.length > 3 && (
        <div className="md:hidden flex items-center text-gray-400">
          <span className="text-xs">({breadcrumbItems.length} levels)</span>
        </div>
      )}
    </nav>
  );
}
