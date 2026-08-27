import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RoleBadge from "./RoleBadge";

/**
 * RoleBadge -- her rol için doğru etiket render edilir. Renk/ikon seçimi
 * `ROLE_META`'da statik olduğu için burada yalnızca görünür metin
 * doğrulanıyor (plan §3, kullanıcı/veteriner/petshop/barınak rozetleri).
 */
describe("RoleBadge", () => {
  it("USER için 'Kullanıcı' gösterir", () => {
    render(<RoleBadge role="USER" />);
    expect(screen.getByText("Kullanıcı")).toBeInTheDocument();
  });

  it("VET için 'Veteriner' gösterir", () => {
    render(<RoleBadge role="VET" />);
    expect(screen.getByText("Veteriner")).toBeInTheDocument();
  });

  it("PETSHOP için 'Petshop' gösterir", () => {
    render(<RoleBadge role="PETSHOP" />);
    expect(screen.getByText("Petshop")).toBeInTheDocument();
  });

  it("BARINAK için 'Barınak' gösterir", () => {
    render(<RoleBadge role="BARINAK" />);
    expect(screen.getByText("Barınak")).toBeInTheDocument();
  });

  it("ADMIN için 'Yönetici' gösterir", () => {
    render(<RoleBadge role="ADMIN" />);
    expect(screen.getByText("Yönetici")).toBeInTheDocument();
  });

  it("role null/undefined ise varsayılan olarak 'Kullanıcı' gösterir", () => {
    render(<RoleBadge role={null} />);
    expect(screen.getByText("Kullanıcı")).toBeInTheDocument();
  });
});
