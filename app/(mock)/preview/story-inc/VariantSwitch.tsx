/** Compare v1 (Apple edit) vs v2 (full pitch). */
export default function VariantSwitch({
  active,
}: {
  active: 'v1' | 'v2';
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1 text-[12px] font-semibold shadow-lg backdrop-blur">
      <a
        href="/preview/story-inc/v1"
        className={`rounded-full px-3 py-1.5 transition-colors ${
          active === 'v1'
            ? 'bg-[#171717] text-white'
            : 'text-[#666] hover:text-[#171717]'
        }`}
      >
        v1
      </a>
      <a
        href="/preview/story-inc/v2"
        className={`rounded-full px-3 py-1.5 transition-colors ${
          active === 'v2'
            ? 'bg-[#171717] text-white'
            : 'text-[#666] hover:text-[#171717]'
        }`}
      >
        v2
      </a>
    </div>
  );
}
