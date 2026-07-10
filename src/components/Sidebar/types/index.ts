import type { ReactNode } from 'react';
import type { MediaType } from '../../../types';

export interface CategoryDef {
  id: MediaType;
  plural: string;
  singular: string;
  icon: ReactNode;
  unit?: string;
}

export interface SidebarProps {
  categories: CategoryDef[];
}

export interface SidebarItemProps {
  label: string;
  icon: ReactNode;
  to: string;
  end?: boolean;
  activeVariant?: 'primary' | 'secondary';
}
