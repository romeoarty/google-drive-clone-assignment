"use client";

import React from "react";
import { useFiles } from "@/contexts/FilesContext";
import {
  Home,
  Folder,
  Star,
  Clock,
  Trash2,
  HardDrive,
  Settings,
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  count,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${
          isActive
            ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
    >
      <span className="mr-3 flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};

export default function DashboardSidebar() {
  const { currentFolder, navigateToFolder } = useFiles();

  const sidebarItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "My Drive",
      isActive: !currentFolder,
      onClick: () => navigateToFolder(null),
    },
    {
      icon: <Folder className="h-5 w-5" />,
      label: "Shared with me",
      isActive: false,
      onClick: () => {}, // TODO: Implement shared files
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Starred",
      isActive: false,
      onClick: () => {}, // TODO: Implement starred files
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Recent",
      isActive: false,
      onClick: () => {}, // TODO: Implement recent files
    },
    {
      icon: <Trash2 className="h-5 w-5" />,
      label: "Trash",
      isActive: false,
      onClick: () => {}, // TODO: Implement trash
    },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto custom-scrollbar">
              {/* Navigation */}
              <nav className="mt-5 flex-1 px-3 space-y-1">
                {sidebarItems.map((item, index) => (
                  <SidebarItem
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    isActive={item.isActive}
                    onClick={item.onClick}
                    count={item.label === "Trash" ? undefined : undefined} // Add counts when implementing features
                  />
                ))}
              </nav>

              {/* Storage info */}
              <div className="flex-shrink-0 px-3 mt-8">
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

              {/* Settings */}
              <div className="flex-shrink-0 px-3 mt-4">
                <SidebarItem
                  icon={<Settings className="h-5 w-5" />}
                  label="Settings"
                  onClick={() => {}} // TODO: Implement settings
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
