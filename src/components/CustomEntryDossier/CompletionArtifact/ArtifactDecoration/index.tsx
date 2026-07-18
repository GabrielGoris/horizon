import { Heart } from "lucide-react";
import type { CompletionArtifactVariant } from "../presets";

export function ArtifactDecoration({ variant }: { variant: CompletionArtifactVariant }) {
  if (variant === "archive") {
    return <span className="absolute left-5 top-0 h-3 w-28 rounded-b-md bg-amber-200/15" />;
  }

  if (variant === "keepsake") {
    return <Heart className="absolute -right-5 -top-5 rotate-12 fill-rose-200/5 text-rose-200/10" size={110} />;
  }

  if (variant === "library") {
    return (
      <>
        <span className="absolute inset-y-0 left-5 w-px bg-yellow-100/10" />
        <span className="absolute left-[17px] top-7 h-2 w-2 rounded-full border border-yellow-100/20 bg-[#2c291d]" />
      </>
    );
  }

  if (variant === "checklist") return <span className="absolute inset-y-0 left-0 w-1 bg-cyan-100/15" />;

  return null;
}
