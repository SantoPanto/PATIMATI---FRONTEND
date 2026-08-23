import { LogIn, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";

type AuthRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function AuthRequiredModal({
  isOpen,
  onClose,
  onLogin,
}: AuthRequiredModalProps) {
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    loginButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-describedby="auth-required-description"
        aria-labelledby="auth-required-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <ShieldCheck size={25} aria-hidden="true" />
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500 dark:text-orange-400">
                Üyelere özel işlem
              </span>
              <h2
                id="auth-required-title"
                className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-50"
              >
                Bu işlem için giriş yapmalısınız
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Pencereyi kapat"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-6 py-6">
          <p
            id="auth-required-description"
            className="text-sm leading-6 text-slate-600 dark:text-slate-400"
          >
            İlan oluşturmak veya kullanıcılarla mesajlaşmak için hesabınıza
            giriş yapın. İlanları ve haritayı misafir olarak incelemeye devam
            edebilirsiniz.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Şimdi değil
            </button>

            <button
              ref={loginButtonRef}
              type="button"
              onClick={onLogin}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
            >
              <LogIn size={19} aria-hidden="true" />
              Giriş Yap
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
