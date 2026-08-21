import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form verileri:", formData);
    setSubmitted(true);
  };

  return (
    <div className="contact-container">
      <div className="contact-card">
        <h2>Bize Ulaşın</h2>
        <p>Soru, öneri veya şikayetleriniz için aşağıdaki formu doldurarak bize ulaşabilirsiniz.</p>

        {submitted ? (
          <div className="contact-success">
            <h3>Mesajınız Alındı! 🐾</h3>
            <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
            <button type="button" onClick={() => setSubmitted(false)} className="contact-reset-btn">
              Yeni Mesaj Gönder
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label>Adınız Soyadınız</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Esma Öztürk"
              />
            </div>

            <div className="form-group">
              <label>E-posta Adresiniz</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@email.com"
              />
            </div>

            <div className="form-group">
              <label>Konu</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ne hakkında yazmak istemiştiniz?"
              />
            </div>

            <div className="form-group">
              <label>Mesajınız</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Mesajınızı buraya yazın..."
              />
            </div>

            <button type="submit" className="contact-submit-btn">
              Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}