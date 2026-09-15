import { revalidatePath, revalidateTag } from 'next/cache';

/** Bust film + home caches (carousel, film pages, rails). */
export function revalidateFilmContent() {
  revalidateTag('film', 'max');
  revalidateTag('home', 'max');
  revalidatePath('/');
}

/** Bust artifact + home caches. */
export function revalidateArtifactContent() {
  revalidateTag('artifact', 'max');
  revalidateTag('home', 'max');
}
