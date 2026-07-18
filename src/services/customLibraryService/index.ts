import { supabase } from "../../lib/supabase";
import type {
  CustomCategoryField,
  CustomCategoryInput,
  CustomEntry,
  CustomEntryInput,
  CustomEntryPhoto,
  CustomFieldValue,
  CustomLibraryCategory,
} from "../../types/customLibrary";
import { getUniqueCustomCategorySlug } from "./helpers";

const PHOTO_BUCKET = "custom-library-photos";
const PHOTO_URL_TTL_SECONDS = 60 * 60;

type CategoryRow = Omit<CustomLibraryCategory, "description" | "fields"> & {
  description?: string | null;
  category_fields?: CustomCategoryField[] | null;
};

type PhotoRow = Omit<CustomEntryPhoto, "caption" | "signed_url"> & {
  caption?: string | null;
};

type EntryRow = Omit<CustomEntry, "cover_url" | "description" | "photos" | "values"> & {
  cover_url?: string | null;
  description?: string | null;
  values?: Record<string, CustomFieldValue> | null;
  custom_entry_photos?: PhotoRow[] | null;
};

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) throw new Error("Usuário não autenticado.");

  return data.user.id;
}

function normalizeCategory(row: CategoryRow): CustomLibraryCategory {
  return {
    ...row,
    description: row.description ?? "",
    fields: [...(row.category_fields ?? [])].sort((a, b) => a.position - b.position),
  };
}

async function signPhoto(photo: PhotoRow): Promise<CustomEntryPhoto> {
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photo.storage_path, PHOTO_URL_TTL_SECONDS);

  return {
    ...photo,
    caption: photo.caption ?? "",
    signed_url: data?.signedUrl,
  };
}

async function normalizeEntry(row: EntryRow): Promise<CustomEntry> {
  const photos = await Promise.all(
    [...(row.custom_entry_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(signPhoto)
  );

  return {
    ...row,
    cover_url: row.cover_url ?? "",
    description: row.description ?? "",
    values: row.values ?? {},
    photos,
  };
}

async function createUniqueSlug(userId: string, name: string) {
  const baseSlug = getUniqueCustomCategorySlug(name, []);
  const { data, error } = await supabase
    .from("library_categories")
    .select("slug")
    .eq("user_id", userId)
    .like("slug", `${baseSlug}%`);

  if (error) throw error;

  return getUniqueCustomCategorySlug(name, (data ?? []).map((item) => String(item.slug)));
}

async function replaceCategoryFields(categoryId: string, userId: string, fields: CustomCategoryInput["fields"]) {
  const { data: currentFields, error: currentFieldsError } = await supabase
    .from("category_fields")
    .select("id")
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (currentFieldsError) throw currentFieldsError;

  const nextIds = new Set(fields.map((field) => field.id));
  const removedIds = (currentFields ?? [])
    .map((field) => String(field.id))
    .filter((id) => !nextIds.has(id));

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from("category_fields")
      .delete()
      .eq("category_id", categoryId)
      .eq("user_id", userId)
      .in("id", removedIds);

    if (error) throw error;
  }

  if (fields.length === 0) return;

  const { error } = await supabase.from("category_fields").upsert(
    fields.map((field, position) => ({
      id: field.id,
      category_id: categoryId,
      user_id: userId,
      label: field.label.trim(),
      field_type: field.field_type,
      phase: field.phase,
      required: field.required,
      options: field.options.map((option) => option.trim()).filter(Boolean),
      position,
    })),
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function fetchCustomCategories() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("library_categories")
    .select("*, category_fields(*)")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => normalizeCategory(row as CategoryRow));
}

export async function createCustomCategory(input: CustomCategoryInput) {
  const userId = await getCurrentUserId();
  const slug = await createUniqueSlug(userId, input.name_plural);
  const { data: lastCategory } = await supabase
    .from("library_categories")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("library_categories")
    .insert({
      user_id: userId,
      slug,
      name_singular: input.name_singular.trim(),
      name_plural: input.name_plural.trim(),
      description: input.description.trim() || null,
      icon: input.icon,
      accent_color: input.accent_color,
      planned_label: input.planned_label.trim(),
      completed_label: input.completed_label.trim(),
      position: Number(lastCategory?.position ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error) throw error;

  try {
    await replaceCategoryFields(data.id, userId, input.fields);
  } catch (fieldError) {
    await supabase.from("library_categories").delete().eq("id", data.id).eq("user_id", userId);
    throw fieldError;
  }

  return normalizeCategory({ ...(data as CategoryRow), category_fields: input.fields.map((field, position) => ({
    ...field,
    category_id: data.id,
    user_id: userId,
    position,
  })) });
}

export async function updateCustomCategory(categoryId: string, input: CustomCategoryInput) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("library_categories")
    .update({
      name_singular: input.name_singular.trim(),
      name_plural: input.name_plural.trim(),
      description: input.description.trim() || null,
      icon: input.icon,
      accent_color: input.accent_color,
      planned_label: input.planned_label.trim(),
      completed_label: input.completed_label.trim(),
    })
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) throw error;

  await replaceCategoryFields(categoryId, userId, input.fields);
}

export async function deleteCustomCategory(categoryId: string) {
  const userId = await getCurrentUserId();
  const { data: entries, error: entryError } = await supabase
    .from("custom_entries")
    .select("custom_entry_photos(storage_path)")
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (entryError) throw entryError;

  const paths = (entries ?? []).flatMap((entry) => {
    const photos = entry.custom_entry_photos as Array<{ storage_path?: string }> | null;
    return (photos ?? []).map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
  });

  if (paths.length > 0) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (error) throw error;
  }

  const { error } = await supabase
    .from("library_categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function fetchCustomEntries(categoryId: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("custom_entries")
    .select("*, custom_entry_photos(*)")
    .eq("category_id", categoryId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return Promise.all((data ?? []).map((row) => normalizeEntry(row as EntryRow)));
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

async function uploadEntryPhotos(entry: CustomEntry, files: File[]) {
  if (files.length === 0) return [];

  const userId = await getCurrentUserId();
  const uploadedPhotos: CustomEntryPhoto[] = [];

  for (const [offset, file] of files.entries()) {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} não é uma imagem válida.`);
    if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} ultrapassa o limite de 10 MB.`);

    const storagePath = `${userId}/${entry.category_id}/${entry.id}/${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data, error: metadataError } = await supabase
      .from("custom_entry_photos")
      .insert({
        entry_id: entry.id,
        user_id: userId,
        storage_path: storagePath,
        position: entry.photos.length + offset,
      })
      .select("*")
      .single();

    if (metadataError) {
      await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
      throw metadataError;
    }

    uploadedPhotos.push(await signPhoto(data as PhotoRow));
  }

  return uploadedPhotos;
}

export async function createCustomEntry(categoryId: string, input: CustomEntryInput, files: File[]) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("custom_entries")
    .insert({
      category_id: categoryId,
      user_id: userId,
      title: input.title.trim(),
      cover_url: input.cover_url.trim() || null,
      description: input.description.trim() || null,
      status: input.status,
      values: input.values,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw error;

  const entry = await normalizeEntry({ ...(data as EntryRow), custom_entry_photos: [] });
  const photos = await uploadEntryPhotos(entry, files);

  return { ...entry, photos };
}

export async function updateCustomEntry(entry: CustomEntry, input: CustomEntryInput, files: File[]) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("custom_entries")
    .update({
      title: input.title.trim(),
      cover_url: input.cover_url.trim() || null,
      description: input.description.trim() || null,
      status: input.status,
      values: input.values,
      completed_at: input.status === "completed" ? entry.completed_at ?? new Date().toISOString() : null,
    })
    .eq("id", entry.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  const updatedEntry = await normalizeEntry({ ...(data as EntryRow), custom_entry_photos: entry.photos });
  const photos = await uploadEntryPhotos(updatedEntry, files);

  return { ...updatedEntry, photos: [...updatedEntry.photos, ...photos] };
}

export async function deleteCustomEntryPhoto(photo: CustomEntryPhoto) {
  const userId = await getCurrentUserId();
  const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  if (storageError) throw storageError;

  const { error } = await supabase
    .from("custom_entry_photos")
    .delete()
    .eq("id", photo.id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteCustomEntry(entry: CustomEntry) {
  const userId = await getCurrentUserId();
  const paths = entry.photos.map((photo) => photo.storage_path);

  if (paths.length > 0) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (error) throw error;
  }

  const { error } = await supabase
    .from("custom_entries")
    .delete()
    .eq("id", entry.id)
    .eq("user_id", userId);

  if (error) throw error;
}
