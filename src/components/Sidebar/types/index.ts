import type { ReactNode } from 'react';

export interface CategoryDef {
  id: string;
  plural: string;
  singular: string;
  icon: ReactNode;
  unit?: string;
}

export interface SidebarProps {
  categories: CategoryDef[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export interface SidebarItemProps {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeVariant?: 'primary' | 'secondary';
}
