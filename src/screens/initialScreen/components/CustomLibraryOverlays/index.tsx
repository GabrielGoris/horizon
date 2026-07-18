import { CustomCategoryDialog } from "../../../../components/CustomCategoryDialog";
import { CustomEntryDialog } from "../../../../components/CustomEntryDialog";
import { CustomEntryDossier } from "../../../../components/CustomEntryDossier";
import { ConfirmationDialog } from "../../../../components/ConfirmationDialog";
import { deleteCustomEntryPhoto } from "../../../../services/customLibraryService";
import type { CustomLibraryCategory } from "../../../../types/customLibrary";
import type { CustomLibraryWorkspace } from "../../hooks/useCustomLibraryWorkspace";

interface CustomLibraryOverlaysProps {
  category?: CustomLibraryCategory;
  workspace: CustomLibraryWorkspace;
}

export function CustomLibraryOverlays({ category, workspace }: CustomLibraryOverlaysProps) {
  return (
    <>
      {workspace.isCategoryDialogOpen && (
        <CustomCategoryDialog
          key={workspace.categoryBeingEdited?.id ?? "new-category"}
          category={workspace.categoryBeingEdited}
          isOpen
          isSaving={workspace.isSavingCategory}
          onClose={workspace.closeCategoryDialog}
          onDelete={workspace.removeCategory}
          onSave={workspace.saveCategory}
        />
      )}

      {category && workspace.isEntryDialogOpen && (
        <CustomEntryDialog
          key={workspace.entryBeingEdited?.id ?? "new-entry"}
          category={category}
          entry={workspace.entryBeingEdited}
          isOpen
          isSaving={workspace.isSavingEntry}
          onClose={workspace.closeEntryDialog}
          onDeletePhoto={deleteCustomEntryPhoto}
          onSave={workspace.saveEntry}
        />
      )}

      {category && workspace.selectedEntry && !workspace.isEntryDialogOpen && (
        <CustomEntryDossier
          key={workspace.selectedEntry.id}
          category={category}
          entry={workspace.selectedEntry}
          onClose={() => workspace.selectEntry(null)}
          onAddPhotos={workspace.addEntryPhotos}
          onDelete={workspace.removeEntry}
          onDeletePhoto={workspace.removeEntryPhoto}
          onEdit={workspace.openEntryEditor}
          onSaveCompletion={workspace.saveEntryCompletion}
          onStatusChange={workspace.changeEntryStatus}
        />
      )}

      <ConfirmationDialog
        isOpen={Boolean(workspace.entryToDelete)}
        isLoading={workspace.isSavingEntry}
        title="Excluir este item?"
        description={`“${workspace.entryToDelete?.title ?? "Este item"}” e todas as suas fotos serão removidos permanentemente.`}
        onCancel={workspace.cancelRemoveEntry}
        onConfirm={() => void workspace.confirmRemoveEntry()}
      />

      <ConfirmationDialog
        isOpen={Boolean(workspace.categoryToDelete)}
        isLoading={workspace.isSavingCategory}
        title="Excluir esta categoria?"
        description={`“${workspace.categoryToDelete?.name_plural ?? "Esta categoria"}”, todos os seus itens e fotos serão removidos permanentemente.`}
        onCancel={workspace.cancelRemoveCategory}
        onConfirm={() => void workspace.confirmRemoveCategory()}
      />
    </>
  );
}
