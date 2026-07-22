import type { ReactNode } from 'react';
import type { MediaType } from '../../../types';
import type { CustomLibraryCategory } from '../../../types/customLibrary';

export interface CategoryDef {
  id: MediaType;
  plural: string;
  singular: string;
  icon: ReactNode;
  unit?: string;
}

export interface SidebarProps {
  categories: CategoryDef[];
  customCategories?: CustomLibraryCategory[];
  onAddCategory?: () => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuOpenChange?: (isOpen: boolean) => void;
}

export interface SidebarItemProps {
  label: string;
  icon: ReactNode;
  to: string;
  end?: boolean;
  activeVariant?: 'primary' | 'secondary';
}
