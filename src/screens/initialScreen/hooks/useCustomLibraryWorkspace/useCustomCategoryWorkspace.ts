import { useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { useToast } from "../../../../components/ToastProvider/hooks/useToast";
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
  const { notify } = useToast();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryBeingEdited, setCategoryBeingEdited] = useState<CustomLibraryCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CustomLibraryCategory | null>(null);
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
    const isEditing = Boolean(categoryBeingEdited);

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
      notify({
        tone: "success",
        title: isEditing ? "Categoria atualizada" : "Categoria criada",
        message: `“${input.name_plural}” foi ${isEditing ? "atualizada" : "adicionada à biblioteca"}.`,
      });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Categoria não salva", message: "Não foi possível salvar esta categoria." });
      throw error;
    } finally {
      setIsSavingCategory(false);
    }
  };

  const removeCategory = async (category: CustomLibraryCategory) => {
    setCategoryToDelete(category);
  };

  const confirmRemoveCategory = async () => {
    if (!categoryToDelete) return;

    setIsSavingCategory(true);

    try {
      await deleteCustomCategory(categoryToDelete.id);
      await refreshCategories();
      setIsCategoryDialogOpen(false);
      setCategoryBeingEdited(null);
      navigate("/");
      notify({ tone: "success", title: "Categoria excluída", message: `“${categoryToDelete.name_plural}” foi removida da biblioteca.` });
      setCategoryToDelete(null);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Categoria não excluída", message: "Não foi possível excluir esta categoria." });
    } finally {
      setIsSavingCategory(false);
    }
  };

  return {
    categoryBeingEdited,
    categoryToDelete,
    cancelRemoveCategory: () => !isSavingCategory && setCategoryToDelete(null),
    closeCategoryDialog,
    confirmRemoveCategory,
    isCategoryDialogOpen,
    isSavingCategory,
    openCategoryEditor,
    openNewCategory,
    removeCategory,
    saveCategory,
  };
}
