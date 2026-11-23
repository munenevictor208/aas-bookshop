type BrandLogoProps = {
  inverse?: boolean;
  compact?: boolean;
  className?: string;
};

export default function BrandLogo({
  inverse = false,
  compact = false,
  className = "",
}: BrandLogoProps) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
        <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="46"
            height="46"
            rx="13"
            fill={inverse ? "#fffdf7" : "#183d2b"}
            stroke="#d6a62f"
            strokeWidth="2"
          />
          <path
            d="M8 15c5.5-2.6 11-2 16 1.4 5-3.4 10.5-4 16-1.4v18.5c-5.5-2.6-11-2-16 1.4-5-3.4-10.5-4-16-1.4V15Z"
            fill={inverse ? "#183d2b" : "#fffdf7"}
          />
          <path d="M24 16.4v18.5" stroke="#d6a62f" strokeWidth="1.8" />
          <path
            d="M12 20.5c2.8-1 5.6-.8 8.4.8M12 25c2.8-1 5.6-.8 8.4.8M27.6 21.3c2.8-1.6 5.6-1.8 8.4-.8M27.6 25.8c2.8-1.6 5.6-1.8 8.4-.8"
            stroke="#d6a62f"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={`block font-serif text-lg font-bold tracking-tight sm:text-xl ${
            inverse ? "text-cream-50" : "text-brand-900"
          }`}
        >
          A&amp;A&apos;s Bookshop
        </span>
        {!compact && (
          <span
            className={`block text-[10px] font-bold uppercase tracking-[0.24em] ${
              inverse ? "text-gold-300" : "text-cocoa-500"
            }`}
          >
            Stationery
          </span>
        )}
      </span>
    </span>
  );
}
