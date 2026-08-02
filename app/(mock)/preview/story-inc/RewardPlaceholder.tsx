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
        className={`relative overflow-hidden bg-black ${className}`}
        role="img"
        aria-label={caption}
      >
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  // No matched asset — plain black (or legacy color fill + caption for older mocks).
  if (!caption) {
    return (
      <div
        className={`bg-black ${className}`}
        role="img"
        aria-label="Reward"
      />
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
