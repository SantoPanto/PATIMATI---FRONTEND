import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamBack } from "./TeamUI";

describe("TeamBack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tarihce modunda gelinen sayfaya döner (history.back) — sabit href profile fırlatıyordu", () => {
    window.history.pushState({}, "", "/notifications");
    const geri = vi.spyOn(window.history, "back").mockImplementation(() => {});

    render(<TeamBack tarihce />);
    fireEvent.click(screen.getByLabelText("Geri"));

    expect(geri).toHaveBeenCalledTimes(1);
  });

  it("varsayılan modda verilen adrese bağlantı verir", () => {
    render(<TeamBack href="/admin" />);
    expect(screen.getByLabelText("Geri").getAttribute("href")).toBe("/admin");
  });
});
