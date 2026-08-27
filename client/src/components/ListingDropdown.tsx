import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Heart, HelpCircle, Search, ShieldAlert } from "lucide-react";

interface DropdownItem {
  label: string;
  href: string;
  icon: typeof Search;
  description: string;
}

const DROPDOWN_ITEMS: DropdownItem[] = [
  {
    label: "Kayıp İlanı",
    href: "/listings?type=LOST",
    icon: Search,
    description: "Kayıp evcil hayvan ilanları",
  },
  {
    label: "Bulundu İlanı",
    href: "/listings?type=FOUND",
    icon: ShieldAlert,
    description: "Bulunan sokak hayvanı veya pet ilanları",
  },
  {
    label: "Sahiplendirme İlanı",
    href: "/listings?type=ADOPTION",
    icon: Heart,
    description: "Sahiplenmeyi bekleyen canlar",
  },
  {
    label: "Yardım İlanı",
    href: "/listings?type=HELP",
    icon: HelpCircle,
    description: "Acil yardım ve destek gerektiren ilanlar",
  },
];

export default function ListingDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = location.startsWith("/listings");

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center">
        <Link
          href="/listings"
          className={`navigation-link inline-flex items-center gap-1.5 ${
            isActive ? "active" : ""
          }`}
          onClick={closeDropdown}
        >
          <span>İlanlar</span>
          <button
            type="button"
            className="inline-flex items-center justify-center p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleDropdown();
            }}
            aria-expanded={isOpen}
            aria-label="İlan türleri menüsünü aç"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180 text-orange-500" : ""
              }`}
            />
          </button>
        </Link>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 top-full pt-2 z-[1100] w-64 animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-2xl">
            {DROPDOWN_ITEMS.map(({ label, href, icon: Icon, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/30"
                onClick={closeDropdown}
                role="menuitem"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white dark:bg-orange-950/60 dark:text-orange-400">
                  <Icon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 transition-colors group-hover:text-orange-600 dark:text-slate-200 dark:group-hover:text-orange-400">
                    {label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
