"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FilesContext";
import { Button } from "@/components/ui";
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  Upload,
  Menu,
  X,
  Home,
  Folder,
  Star,
  Clock,
  Trash2,
  HardDrive,
} from "lucide-react";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { currentFolder, navigateToFolder } = useFiles();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center ml-2 lg:ml-0">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"
                  />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900 hidden sm:block">
                Drive Clone
              </h1>
            </div>
          </div>

          {/* Center - Search bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search files and folders..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center space-x-4">
            {/* Upload button */}
            <Button size="sm" className="hidden sm:inline-flex">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <Bell className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center text-sm rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <span className="ml-2 text-gray-700 hidden sm:block">
                  {user?.name}
                </span>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-gray-500">{user?.email}</div>
                      </div>

                      <button className="context-menu-item w-full">
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </button>

                      <button
                        className="context-menu-item w-full danger"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search files and folders..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Mobile navigation overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile menu */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Mobile menu content */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">
                    Drive Clone
                  </h2>
                </div>

                {/* Mobile navigation items */}
                <nav className="mt-5 px-2 space-y-1">
                  <button
                    onClick={() => navigateToFolder(null)}
                    className={`
                      w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors
                      ${
                        !currentFolder
                          ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <Home className="mr-4 h-6 w-6" />
                    My Drive
                  </button>
                  
                  <button
                    onClick={() => {}} // TODO: Implement shared files
                    className="w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Folder className="mr-4 h-6 w-6" />
                    Shared with me
                  </button>
                  
                  <button
                    onClick={() => {}} // TODO: Implement starred files
                    className="w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Star className="mr-4 h-6 w-6" />
                    Starred
                  </button>
                  
                  <button
                    onClick={() => {}} // TODO: Implement recent files
                    className="w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Clock className="mr-4 h-6 w-6" />
                    Recent
                  </button>
                  
                  <button
                    onClick={() => {}} // TODO: Implement trash
                    className="w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Trash2 className="mr-4 h-6 w-6" />
                    Trash
                  </button>
                  
                  <div className="pt-4 pb-2">
                    <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Storage
                    </div>
                  </div>
                  
                  <div className="px-3 py-2">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <HardDrive className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Storage
                        </span>
                      </div>

                      {/* Storage progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: "35%" }}
                        ></div>
                      </div>

                      <div className="text-xs text-gray-600">
                        3.5 GB of 10 GB used
                      </div>

                      <button className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Get more storage
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {}} // TODO: Implement settings
                    className="w-full flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Settings className="mr-4 h-6 w-6" />
                    Settings
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
