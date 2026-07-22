import { supabase } from "../../lib/supabase";

const MEDIA_ASSET_BUCKET = "media-assets";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function uploadMediaAsset(file: File, kind: "cover" | "backdrop") {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Use uma imagem JPEG, PNG, WebP ou AVIF.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("A imagem deve ter no máximo 8 MB.");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Faça login novamente para enviar uma imagem.");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userData.user.id}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_ASSET_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (uploadError) throw uploadError;

  return supabase.storage.from(MEDIA_ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
}
