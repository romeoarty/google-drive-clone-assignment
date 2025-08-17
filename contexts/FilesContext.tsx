'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { IFile, IFolder } from '@/lib/models';

interface FilesContextType {
  files: IFile[];
  folders: IFolder[];
  currentFolder: IFolder | null;
  isLoading: boolean;
  error: string | null;
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // Navigation
  navigateToFolder: (folderId: string | null) => void;
  goBack: () => void;
  
  // Data fetching
  fetchData: () => Promise<void>;
  
  // File operations
  uploadFile: (file: File, folderId?: string | null) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (fileId: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (fileId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  
  // Folder operations
  createFolder: (name: string, parentId?: string | null) => Promise<{ success: boolean; error?: string }>;
  deleteFolder: (folderId: string) => Promise<{ success: boolean; error?: string }>;
  renameFolder: (folderId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  
  // Sorting
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
};

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<IFile[]>([]);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<IFolder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [folderHistory, setFolderHistory] = useState<(string | null)[]>([null]);

  // Memoized API request function with better error handling
  const makeApiRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }, []);

  // Fetch files and folders with better error handling
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const currentFolderId = currentFolder?._id || 'root';
      
      // Fetch files and folders in parallel
      const [filesResult, foldersResult] = await Promise.all([
        makeApiRequest(`/api/files?folderId=${currentFolderId}&sortBy=${sortBy}&order=${sortOrder}`),
        makeApiRequest(`/api/folders?parentId=${currentFolderId}&sortBy=${sortBy}&order=${sortOrder}`)
      ]);

      if (filesResult.success && foldersResult.success) {
        setFiles(filesResult.data?.files || []);
        setFolders(foldersResult.data?.folders || []);
      } else {
        const errorMsg = filesResult.error || foldersResult.error || 'Failed to fetch data';
        setError(errorMsg);
        console.error('Fetch data error:', errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to fetch data';
      setError(errorMsg);
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentFolder, sortBy, sortOrder, makeApiRequest]);

  // Navigate to folder
  const navigateToFolder = useCallback((folderId: string | null) => {
    const folder = folderId ? folders.find(f => f._id === folderId) : null;
    setCurrentFolder(folder);
    
    // Update folder history
    setFolderHistory(prev => [...prev, folderId]);
  }, [folders]);

  // Go back to previous folder
  const goBack = useCallback(() => {
    if (folderHistory.length > 1) {
      const newHistory = [...folderHistory];
      newHistory.pop(); // Remove current
      const previousFolderId = newHistory[newHistory.length - 1];
      
      setFolderHistory(newHistory);
      const folder = previousFolderId ? folders.find(f => f._id === previousFolderId) : null;
      setCurrentFolder(folder);
    }
  }, [folderHistory, folders]);

  // Upload file with progress handling
  const uploadFile = useCallback(async (file: File, folderId?: string | null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId || currentFolder?._id || 'root');

      const result = await makeApiRequest('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Upload failed' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }, [currentFolder, makeApiRequest, fetchData]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const result = await makeApiRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Delete failed' };
      }
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: 'Delete failed' };
    }
  }, [makeApiRequest, fetchData]);

  // Rename file
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      const result = await makeApiRequest(`/api/files/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify({ originalName: newName }),
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Rename failed' };
      }
    } catch (error) {
      console.error('Rename file error:', error);
      return { success: false, error: 'Rename failed' };
    }
  }, [makeApiRequest, fetchData]);

  // Create folder
  const createFolder = useCallback(async (name: string, parentId?: string | null) => {
    try {
      const result = await makeApiRequest('/api/folders', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          parentId: parentId || currentFolder?._id || null 
        }),
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Create folder failed' };
      }
    } catch (error) {
      console.error('Create folder error:', error);
      return { success: false, error: 'Create folder failed' };
    }
  }, [currentFolder, makeApiRequest, fetchData]);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      const result = await makeApiRequest(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Delete folder failed' };
      }
    } catch (error) {
      console.error('Delete folder error:', error);
      return { success: false, error: 'Delete folder failed' };
    }
  }, [makeApiRequest, fetchData]);

  // Rename folder
  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      const result = await makeApiRequest(`/api/folders/${folderId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      });

      if (result.success) {
        await fetchData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Rename folder failed' };
      }
    } catch (error) {
      console.error('Rename folder error:', error);
      return { success: false, error: 'Rename folder failed' };
    }
  }, [makeApiRequest, fetchData]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    files,
    folders,
    currentFolder,
    isLoading,
    error,
    sortBy,
    sortOrder,
    navigateToFolder,
    goBack,
    fetchData,
    uploadFile,
    deleteFile,
    renameFile,
    createFolder,
    deleteFolder,
    renameFolder,
    setSortBy,
    setSortOrder,
  }), [
    files,
    folders,
    currentFolder,
    isLoading,
    error,
    sortBy,
    sortOrder,
    navigateToFolder,
    goBack,
    fetchData,
    uploadFile,
    deleteFile,
    renameFile,
    createFolder,
    deleteFolder,
    renameFolder,
  ]);

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  );
};