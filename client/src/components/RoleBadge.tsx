import { Home, PawPrint, ShieldCheck, ShoppingBag, Stethoscope } from "lucide-react";
import type { Role } from "../services/types";
import { POI_RENKLERI } from "../utils/haritaSunum";

type RoleBadgeMeta = {
  label: string;
  icon: typeof PawPrint;
  color: string;
};

/*
 * Rol rozeti renkleri -- Veteriner/Petshop/Barınak için ana haritadaki
 * POI_RENKLERI ile AYNI kaynak (bkz. utils/haritaSunum.ts), kullanıcı
 * rozet olarak gördüğü rengi haritada da görsün diye. Kullanıcı/Yönetici
 * hizmet değil, bu ikisinde marka rengi (`#F97316`, `AdCard.tsx`'teki
 * "pati" turuncusu) ve nötr gri kullanılır.
 */
const ROLE_META: Record<Role, RoleBadgeMeta> = {
  GUEST: { label: "Misafir", icon: PawPrint, color: "#64748B" },
  USER: { label: "Kullanıcı", icon: PawPrint, color: "#F97316" },
  ADMIN: { label: "Yönetici", icon: ShieldCheck, color: "#64748B" },
  VET: { label: "Veteriner", icon: Stethoscope, color: POI_RENKLERI.VETERINARY },
  PETSHOP: { label: "Petshop", icon: ShoppingBag, color: POI_RENKLERI.PET_SHOP },
  BARINAK: { label: "Barınak", icon: Home, color: POI_RENKLERI.SHELTER },
};

/**
 * Kullanıcının rolüne göre küçük, renkli bir pati/hizmet rozeti --
 * `ProfilePage.tsx`'teki düz metin ("Yönetici"/"Kullanıcı") yerine.
 * Renkler `ServicesPage`/ana haritadaki hizmet renkleriyle AYNI kaynaktan
 * (`POI_RENKLERI`) gelir, görsel tutarlılık için.
 */
export default function RoleBadge({
  role,
  size = "md",
}: {
  role: Role | null | undefined;
  size?: "sm" | "md";
}) {
  const meta = ROLE_META[role ?? "USER"];
  const Icon = meta.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
    >
      <Icon size={isSmall ? 12 : 14} />
      {meta.label}
    </span>
  );
}
