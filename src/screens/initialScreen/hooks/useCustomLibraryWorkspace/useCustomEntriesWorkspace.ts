import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../../../components/ToastProvider/hooks/useToast";
import {
  createCustomEntry,
  deleteCustomEntry,
  deleteCustomEntryPhoto,
  fetchCustomEntries,
  updateCustomEntry,
} from "../../../../services/customLibraryService";
import type {
  CustomEntry,
  CustomEntryInput,
  CustomEntryPhoto,
  CustomFieldValue,
  CustomLibraryCategory,
} from "../../../../types/customLibrary";

interface UseCustomEntriesWorkspaceOptions {
  category?: CustomLibraryCategory;
  isActive: boolean;
}

export function useCustomEntriesWorkspace({ category, isActive }: UseCustomEntriesWorkspaceOptions) {
  const { notify } = useToast();
  const [entries, setEntries] = useState<CustomEntry[]>([]);
  const [entriesError, setEntriesError] = useState("");
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [loadedCategoryId, setLoadedCategoryId] = useState("");
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CustomEntry | null>(null);
  const [entryBeingEdited, setEntryBeingEdited] = useState<CustomEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<CustomEntry | null>(null);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const entriesRequestId = useRef(0);

  const refreshEntries = useCallback(async () => {
    const categoryId = category?.id;

    if (!categoryId) {
      setEntries([]);
      setLoadedCategoryId("");
      return;
    }

    const requestId = ++entriesRequestId.current;
    setIsLoadingEntries(true);
    setEntriesError("");

    try {
      const nextEntries = await fetchCustomEntries(categoryId);
      if (entriesRequestId.current !== requestId) return;
      setEntries(nextEntries);
      setLoadedCategoryId(categoryId);
    } catch (loadError) {
      if (entriesRequestId.current !== requestId) return;
      console.error(loadError);
      setEntriesError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os itens desta categoria.");
      setLoadedCategoryId(categoryId);
    } finally {
      if (entriesRequestId.current === requestId) setIsLoadingEntries(false);
    }
  }, [category?.id]);

  useEffect(() => {
    if (!isActive || !category) {
      entriesRequestId.current += 1;
      return;
    }

    const categoryId = category.id;
    const requestId = ++entriesRequestId.current;

    fetchCustomEntries(categoryId)
      .then((nextEntries) => {
        if (entriesRequestId.current !== requestId) return;
        setEntries(nextEntries);
        setEntriesError("");
        setLoadedCategoryId(categoryId);
      })
      .catch((loadError) => {
        if (entriesRequestId.current !== requestId) return;
        console.error(loadError);
        setEntriesError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os itens desta categoria.");
        setLoadedCategoryId(categoryId);
      })
      .finally(() => {
        if (entriesRequestId.current === requestId) setIsLoadingEntries(false);
      });

    return () => {
      entriesRequestId.current += 1;
    };
  }, [category, isActive]);

  const openNewEntry = () => {
    setEntryBeingEdited(null);
    setIsEntryDialogOpen(true);
  };

  const openEntryEditor = (entry: CustomEntry) => {
    setEntryBeingEdited(entry);
    setSelectedEntry(null);
    setIsEntryDialogOpen(true);
  };

  const closeEntryDialog = () => {
    if (isSavingEntry) return;
    setIsEntryDialogOpen(false);
    setEntryBeingEdited(null);
  };

  const saveEntry = async (input: CustomEntryInput, photos: File[]) => {
    if (!category) return;

    setIsSavingEntry(true);
    const isEditing = Boolean(entryBeingEdited);

    try {
      if (entryBeingEdited) {
        setSelectedEntry(await updateCustomEntry(entryBeingEdited, input, photos));
      } else {
        await createCustomEntry(category.id, input, photos);
      }

      await refreshEntries();
      setIsEntryDialogOpen(false);
      setEntryBeingEdited(null);
      notify({
        tone: "success",
        title: isEditing ? "Item atualizado" : "Item adicionado",
        message: `“${input.title}” foi ${isEditing ? "atualizado" : "adicionado à categoria"}.`,
      });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Item não salvo", message: "Não foi possível salvar este item." });
      throw error;
    } finally {
      setIsSavingEntry(false);
    }
  };

  const removeEntry = async (entry: CustomEntry) => {
    setEntryToDelete(entry);
  };

  const confirmRemoveEntry = async () => {
    if (!entryToDelete) return;

    setIsSavingEntry(true);

    try {
      await deleteCustomEntry(entryToDelete);
      await refreshEntries();
      setIsEntryDialogOpen(false);
      setSelectedEntry(null);
      setEntryBeingEdited(null);
      notify({ tone: "success", title: "Item excluído", message: `“${entryToDelete.title}” foi removido da categoria.` });
      setEntryToDelete(null);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Item não excluído", message: "Não foi possível excluir este item." });
    } finally {
      setIsSavingEntry(false);
    }
  };

  const updateEntry = async (
    entry: CustomEntry,
    changes: Partial<Pick<CustomEntryInput, "status" | "values">>,
    photos: File[] = []
  ) => {
    const updatedEntry = await updateCustomEntry(entry, {
      title: entry.title,
      cover_url: entry.cover_url,
      description: entry.description,
      status: changes.status ?? entry.status,
      values: changes.values ?? entry.values,
    }, photos);

    setSelectedEntry(updatedEntry);
    await refreshEntries();
  };

  const changeEntryStatus = async (entry: CustomEntry, status: CustomEntry["status"]) => {
    try {
      await updateEntry(entry, { status });
      notify({ tone: "success", title: "Estado atualizado", message: `O estado de “${entry.title}” foi alterado.` });
    } catch (statusError) {
      console.error(statusError);
      setEntriesError(statusError instanceof Error ? statusError.message : "Não foi possível alterar o estado do item.");
      notify({ tone: "error", title: "Estado não atualizado", message: "Não foi possível alterar o estado deste item." });
    }
  };

  const saveEntryCompletion = async (entry: CustomEntry, values: Record<string, CustomFieldValue>) => {
    try {
      await updateEntry(entry, { status: "completed", values });
      notify({ tone: "success", title: "Registro salvo", message: `A conclusão de “${entry.title}” foi atualizada.` });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Registro não salvo", message: "Não foi possível salvar os dados de conclusão." });
      throw error;
    }
  };

  const addEntryPhotos = async (entry: CustomEntry, photos: File[]) => {
    try {
      await updateEntry(entry, {}, photos);
      notify({ tone: "success", title: "Galeria atualizada", message: `${photos.length} ${photos.length === 1 ? "foto foi adicionada" : "fotos foram adicionadas"}.` });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Fotos não adicionadas", message: "Não foi possível atualizar a galeria." });
      throw error;
    }
  };

  const removeEntryPhoto = async (entry: CustomEntry, photo: CustomEntryPhoto) => {
    try {
      await deleteCustomEntryPhoto(photo);
      setSelectedEntry({ ...entry, photos: entry.photos.filter((item) => item.id !== photo.id) });
      await refreshEntries();
      notify({ tone: "success", title: "Foto removida", message: "A foto foi removida da galeria." });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Foto não removida", message: "Não foi possível remover a foto da galeria." });
      throw error;
    }
  };

  return {
    addEntryPhotos,
    cancelRemoveEntry: () => !isSavingEntry && setEntryToDelete(null),
    changeEntryStatus,
    closeEntryDialog,
    confirmRemoveEntry,
    entries,
    entriesError,
    entryBeingEdited,
    entryToDelete,
    isEntryDialogOpen,
    isLoadingEntries: Boolean(category) && (isLoadingEntries || loadedCategoryId !== category?.id),
    isSavingEntry,
    openEntryEditor,
    openNewEntry,
    refreshEntries,
    removeEntry,
    removeEntryPhoto,
    saveEntry,
    saveEntryCompletion,
    selectedEntry,
    selectEntry: setSelectedEntry,
  };
}
