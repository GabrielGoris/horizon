import { useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import {
  createCustomCategory,
  deleteCustomCategory,
  updateCustomCategory,
} from "../../../../services/customLibraryService";
import type { CustomCategoryInput, CustomLibraryCategory } from "../../../../types/customLibrary";

interface UseCustomCategoryWorkspaceOptions {
  navigate: NavigateFunction;
  refreshCategories: () => Promise<void>;
}

export function useCustomCategoryWorkspace({ navigate, refreshCategories }: UseCustomCategoryWorkspaceOptions) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryBeingEdited, setCategoryBeingEdited] = useState<CustomLibraryCategory | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const openNewCategory = () => {
    setCategoryBeingEdited(null);
    setIsCategoryDialogOpen(true);
  };

  const openCategoryEditor = (category: CustomLibraryCategory) => {
    setCategoryBeingEdited(category);
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    if (isSavingCategory) return;
    setIsCategoryDialogOpen(false);
    setCategoryBeingEdited(null);
  };

  const saveCategory = async (input: CustomCategoryInput) => {
    setIsSavingCategory(true);

    try {
      if (categoryBeingEdited) {
        await updateCustomCategory(categoryBeingEdited.id, input);
        await refreshCategories();
      } else {
        const createdCategory = await createCustomCategory(input);
        await refreshCategories();
        navigate(`/c/${createdCategory.slug}`);
      }

      setIsCategoryDialogOpen(false);
      setCategoryBeingEdited(null);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const removeCategory = async (category: CustomLibraryCategory) => {
    if (!window.confirm(`Excluir “${category.name_plural}” e todos os seus itens e fotos? Esta ação não pode ser desfeita.`)) return;

    setIsSavingCategory(true);

    try {
      await deleteCustomCategory(category.id);
      await refreshCategories();
      setIsCategoryDialogOpen(false);
      setCategoryBeingEdited(null);
      navigate("/");
    } finally {
      setIsSavingCategory(false);
    }
  };

  return {
    categoryBeingEdited,
    closeCategoryDialog,
    isCategoryDialogOpen,
    isSavingCategory,
    openCategoryEditor,
    openNewCategory,
    removeCategory,
    saveCategory,
  };
}
