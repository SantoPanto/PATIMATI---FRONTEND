import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ComplaintModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ComplaintModal({ open, onClose }: ComplaintModalProps) {
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Şikayet sistemi</p>
            <h3>Şikayet bildir</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-banner">
            <AlertTriangle size={18} />
            <span>Gizlilik ve güvenlik sorunlarını hızlıca bildirebilirsiniz.</span>
          </div>

          <label className="field">
            <span>Konu</span>
            <input placeholder="Örn. Yanlış ilan bilgisi" />
          </label>
          <label className="field">
            <span>Açıklama</span>
            <textarea rows={4} placeholder="Sorunu kısaca anlatın" />
          </label>

          <button
            className="button button--primary button--full"
            onClick={() => setSubmitted(true)}
            type="button"
          >
            Şikayeti Gönder
          </button>

          {submitted ? <p className="success-message">Şikayetiniz alındı. Ekibimiz en kısa sürede inceleyecek.</p> : null}
        </div>
      </div>
    </div>
  );
}
