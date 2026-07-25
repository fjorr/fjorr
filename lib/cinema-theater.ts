/**
 * Shared CinemaTheater load helpers — warm the chunk early so first Play feels instant.
 */

export function preloadCinemaTheater() {
  return import('@/components/CinemaTheater');
}
