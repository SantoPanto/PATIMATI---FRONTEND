import React, { useState } from "react";
import { useLocation } from "wouter";
import { reportService } from "../services/reportService";

export default function PublicReportPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    petType: "KEDİ",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportService.submitReport(formData);
      setSubmitted(true);
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error) {
      console.error("İhbar gönderilemedi", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Halka Açık İhbar Formu</h1>
      {submitted ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          İhbarınız başarıyla alındı! Ana sayfaya yönlendiriliyorsunuz...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Başlık</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Açıklama / Durum</label>
            <textarea
              className="w-full border p-2 rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Konum</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Örn: Nilüfer, Bursa"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            İhbarı Gönder
          </button>
        </form>
      )}
    </div>
  );
}