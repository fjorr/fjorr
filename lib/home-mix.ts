export type HomeMix = {
  slug: string;
  name: string;
  /** Optional one-line POV under the mix title. */
  description: string | null;
  filmIds: string[];
  artifactIds: string[];
};

export function mixIdsForType(
  mix: HomeMix,
  type: 'film' | 'artifact'
): string[] {
  return type === 'film' ? mix.filmIds : mix.artifactIds;
}
