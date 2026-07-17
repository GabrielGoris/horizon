import { CustomCategoryDialog } from "../../../../components/CustomCategoryDialog";
import { CustomEntryDialog } from "../../../../components/CustomEntryDialog";
import { CustomEntryDossier } from "../../../../components/CustomEntryDossier";
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
    </>
  );
}
