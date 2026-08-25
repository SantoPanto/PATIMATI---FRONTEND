import { ChevronDown, Home, ShoppingBag, Stethoscope, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

/**
 * Header'daki "Hizmetler" dropdown'ı. Barınak/Petshop şu anlık pasif
 * placeholder -- yalnızca Veteriner işlevsel (bkz. VetDirectoryPage).
 */
export default function ServicesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="services-dropdown" ref={containerRef}>
      <button
        type="button"
        className="header-notification-button services-dropdown__trigger"
        aria-label="Hizmetler"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Store size={20} />
        <ChevronDown size={14} className="services-dropdown__chevron" />
      </button>

      {isOpen && (
        <div className="services-dropdown__menu" role="menu">
          <span className="services-dropdown__item services-dropdown__item--disabled" aria-disabled="true">
            <Home size={17} />
            Barınak
          </span>
          <span className="services-dropdown__item services-dropdown__item--disabled" aria-disabled="true">
            <ShoppingBag size={17} />
            Petshop
          </span>
          <Link
            href="/hizmetler/veteriner"
            className="services-dropdown__item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Stethoscope size={17} />
            Veteriner
          </Link>
        </div>
      )}
    </div>
  );
}
