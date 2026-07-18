import { useCallback, useEffect, useRef, useState } from "react";
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
  const [entries, setEntries] = useState<CustomEntry[]>([]);
  const [entriesError, setEntriesError] = useState("");
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [loadedCategoryId, setLoadedCategoryId] = useState("");
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CustomEntry | null>(null);
  const [entryBeingEdited, setEntryBeingEdited] = useState<CustomEntry | null>(null);
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

    try {
      if (entryBeingEdited) {
        setSelectedEntry(await updateCustomEntry(entryBeingEdited, input, photos));
      } else {
        await createCustomEntry(category.id, input, photos);
      }

      await refreshEntries();
      setIsEntryDialogOpen(false);
      setEntryBeingEdited(null);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const removeEntry = async (entry: CustomEntry) => {
    if (!window.confirm(`Excluir “${entry.title}” e suas fotos?`)) return;

    setIsSavingEntry(true);

    try {
      await deleteCustomEntry(entry);
      await refreshEntries();
      setIsEntryDialogOpen(false);
      setSelectedEntry(null);
      setEntryBeingEdited(null);
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
    } catch (statusError) {
      console.error(statusError);
      setEntriesError(statusError instanceof Error ? statusError.message : "Não foi possível alterar o estado do item.");
    }
  };

  const saveEntryCompletion = (entry: CustomEntry, values: Record<string, CustomFieldValue>) => (
    updateEntry(entry, { status: "completed", values })
  );

  const addEntryPhotos = (entry: CustomEntry, photos: File[]) => updateEntry(entry, {}, photos);

  const removeEntryPhoto = async (entry: CustomEntry, photo: CustomEntryPhoto) => {
    await deleteCustomEntryPhoto(photo);
    setSelectedEntry({ ...entry, photos: entry.photos.filter((item) => item.id !== photo.id) });
    await refreshEntries();
  };

  return {
    addEntryPhotos,
    changeEntryStatus,
    closeEntryDialog,
    entries,
    entriesError,
    entryBeingEdited,
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
