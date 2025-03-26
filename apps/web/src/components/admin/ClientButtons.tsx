"use client";

import React from 'react';

interface ButtonProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ className, children, onClick }: ButtonProps) {
  return (
    <button 
      className={className || "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface DeleteButtonProps {
  className?: string;
  onClick?: () => void;
}

export function DeleteButton({ className, onClick }: DeleteButtonProps) {
  return (
    <button 
      className={className || "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"}
      onClick={onClick}
    >
      Delete
    </button>
  );
}

interface RefreshButtonProps {
  className?: string;
  onClick?: () => void;
}

export function RefreshButton({ className, onClick }: RefreshButtonProps) {
  return (
    <button 
      className={className || "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"}
      onClick={onClick}
    >
      Refresh
    </button>
  );
}

interface FilterButtonProps {
  className?: string;
  onClick?: () => void;
}

export function FilterButton({ className, onClick }: FilterButtonProps) {
  return (
    <button 
      className={className || "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"}
      onClick={onClick}
    >
      Filter
    </button>
  );
}

interface EditButtonProps {
  className?: string;
  onClick?: () => void;
}

export function EditButton({ className, onClick }: EditButtonProps) {
  return (
    <button 
      className={className || "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"}
      onClick={onClick}
    >
      Edit Product
    </button>
  );
}

interface DetailButtonProps {
  className?: string;
  onClick?: () => void;
}

export function DetailButton({ className, onClick }: DetailButtonProps) {
  return (
    <button
      className={className || "text-blue-600 hover:text-blue-800 font-medium"}
      onClick={onClick}
    >
      Details
    </button>
  );
} 