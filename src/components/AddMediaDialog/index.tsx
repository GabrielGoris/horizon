import { useForm } from "react-hook-form";
import { createMedia } from "../../services/mediaService";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMediaSchema, type CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";

interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function AddMediaDialog({ isOpen, onClose, onSuccess }: AddMediaDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMediaDTO>({
    resolver: zodResolver(createMediaSchema),
    defaultValues: {
      title: "",
      creator: "",
      director: "",
      type: "games",
      category: "",
      cover: "",
      status: "queue",
      description: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateMediaDTO) => {
    try {
      await createMedia(data);
      await onSuccess();
      reset();
      onClose();
    } catch (error) {
        console.error("Erro ao guardar:", error);
        alert("Erro ao guardar a obra.");
    }
  };

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#131315] px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]";
  const labelClass = "flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400";
  const errorClass = "text-[10px] text-red-400 normal-case tracking-normal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl border border-white/10 bg-[#1a1a1e] p-8 shadow-2xl">
        
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="font-serif text-3xl font-bold text-[#ebdcb9]">Adicionar Obra</h2>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className={labelClass}>
              Título da Obra *
              <input 
                placeholder="Ex: Elden Ring"
                {...register("title")} 
                className={`${inputClass} ${errors.title ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`} 
              />
              {errors.title && <span className={errorClass}>{errors.title.message}</span>}
            </label>
            
            <label className={labelClass}>
              Estúdio
              <input 
                placeholder="Ex: FromSoftware"
                {...register("creator")} 
                className={inputClass} 
              />
            </label>
          </div>

          <label className={labelClass}>
            Diretor
            <input
              placeholder="Ex: Denis Villeneuve"
              {...register("director")}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className={labelClass}>
              Tipo *
              <select {...register("type")} className={inputClass}>
                <option value="games">Jogo</option>
                <option value="movies">Filme</option>
                <option value="books">Livro</option>
              </select>
              {errors.type && <span className={errorClass}>{errors.type.message}</span>}
            </label>

            <label className={labelClass}>
              Gênero / Categoria
              <input 
                placeholder="Ex: RPG, Sci-Fi..."
                {...register("category")} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className={labelClass}>
              URL da Capa (Imagem)
              <input 
                placeholder="https://..."
                {...register("cover")} 
                className={`${inputClass} ${errors.cover ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`} 
              />
              {errors.cover && <span className={errorClass}>{errors.cover.message}</span>}
            </label>

            <label className={labelClass}>
              Estado na Biblioteca *
              <select {...register("status")} className={inputClass}>
                <option value="queue">Na Fila (Quero jogar/ver)</option>
                <option value="reading">Em Andamento</option>
                <option value="new">Jogado/Visto Recentemente</option>
                <option value="complete">Finalizado / Completo</option>
              </select>
              {errors.status && <span className={errorClass}>{errors.status.message}</span>}
            </label>
          </div>

          <label className={labelClass}>
            Breve Sinopse / Comentário
            <textarea 
              rows={3}
              placeholder="Sobre o que é esta obra?"
              {...register("description")} 
              className={`${inputClass} resize-none`} 
            />
          </label>

          <div className="mt-4 flex items-center justify-end gap-4 border-t border-white/5 pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="rounded-lg bg-[#d4af37] px-8 py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#d4af37]/20 transition-all hover:bg-[#ebdcb9] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:transform-none"
            >
              {isSubmitting ? "A Guardar..." : "Guardar Obra"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
