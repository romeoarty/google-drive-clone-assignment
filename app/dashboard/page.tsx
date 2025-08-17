'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useFiles } from '@/contexts/FilesContext';
import { Button, LoadingSpinner, useToast } from '@/components/ui';
import FileUpload from '@/components/dashboard/FileUpload';
import FileGrid from '@/components/dashboard/FileGrid';
import FileList from '@/components/dashboard/FileList';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import CreateFolderModal from '@/components/dashboard/CreateFolderModal';
import { 
  Upload, 
  FolderPlus, 
  Grid3X3, 
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

export default function DashboardPage() {
  const {
    files,
    folders,
    currentFolder,
    isLoading,
    error,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    fetchData
  } = useFiles();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const { toast } = useToast();

  // Memoized sort change handler (addressing feedback)
  const handleSortChange = useCallback((newSortBy: 'name' | 'date' | 'size') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder, setSortBy, setSortOrder]);

  // Memoized items for better performance
  const allItems = useMemo(() => [
    ...folders.map(folder => ({ ...folder, type: 'folder' as const })),
    ...files.map(file => ({ ...file, type: 'file' as const }))
  ], [folders, files]);

  const handleRefresh = useCallback(async () => {
    try {
      await fetchData();
      toast('Files refreshed successfully', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      toast('Failed to refresh files', 'error');
    }
  }, [fetchData, toast]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading files</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {currentFolder ? currentFolder.name : 'My Drive'}
          </h1>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsCreateFolderModalOpen(true)}
            size="sm"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Sort options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex space-x-1">
              {(['name', 'date', 'size'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => handleSortChange(option)}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${
                    sortBy === option
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                  {sortBy === option && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? (
                        <SortAsc className="h-3 w-3" />
                      ) : (
                        <SortDesc className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 text-sm text-gray-600">
          {folders.length + files.length} items
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
          <p className="text-gray-600 mb-6">Upload files or create folders to get started</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderModalOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {viewMode === 'grid' ? (
            <FileGrid files={files} folders={folders} />
          ) : (
            <FileList files={files} folders={folders} />
          )}
        </div>
      )}

      {/* Modals */}
      <FileUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
      />
    </div>
  );
}