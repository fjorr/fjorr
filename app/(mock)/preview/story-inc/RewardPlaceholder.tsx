/** Color-fill media placeholder — or photo when `image` is set. */
export default function RewardPlaceholder({
  color,
  caption,
  image,
  className = '',
}: {
  color: string;
  caption: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      <div
        className={`relative overflow-hidden bg-[#f5f5f7] ${className}`}
        role="img"
        aria-label={caption}
      >
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
        />
        <p className="absolute bottom-0 left-0 right-0 z-[1] p-4 text-[13px] font-semibold tracking-tight text-white sm:p-5 sm:text-[14px]">
          {caption}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-end overflow-hidden ${className}`}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={caption}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), transparent 50%), linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)',
        }}
      />
      <p className="relative z-[1] p-4 text-[13px] font-semibold tracking-tight text-white sm:p-5 sm:text-[14px]">
        {caption}
      </p>
    </div>
  );
}
