import type { NavigateFunction } from "react-router-dom";
import type { CustomLibraryCategory } from "../../../../types/customLibrary";
import { useCustomCategoryWorkspace } from "./useCustomCategoryWorkspace";
import { useCustomEntriesWorkspace } from "./useCustomEntriesWorkspace";

interface UseCustomLibraryWorkspaceOptions {
  category?: CustomLibraryCategory;
  isActive: boolean;
  navigate: NavigateFunction;
  refreshCategories: () => Promise<void>;
}

export function useCustomLibraryWorkspace(options: UseCustomLibraryWorkspaceOptions) {
  const categoryWorkspace = useCustomCategoryWorkspace({
    navigate: options.navigate,
    refreshCategories: options.refreshCategories,
  });
  const entriesWorkspace = useCustomEntriesWorkspace({
    category: options.category,
    isActive: options.isActive,
  });

  return { ...categoryWorkspace, ...entriesWorkspace };
}

export type CustomLibraryWorkspace = ReturnType<typeof useCustomLibraryWorkspace>;
