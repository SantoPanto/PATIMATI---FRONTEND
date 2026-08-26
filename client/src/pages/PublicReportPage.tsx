import React, { useState } from 'react';

export default function PublicReportForm() {
  const [contact, setContact] = useState('');
  const [reportType, setReportType] = useState('YARALI');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('reporter_contact', contact);
    formData.append('type', reportType);
    formData.append('note', note);
    if (file) formData.append('photo', file);
    if (location) {
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
    }

    console.log("İhbar gönderiliyor...", Object.fromEntries(formData));
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-pink-600">Sahipsiz / Yaralı Hayvan İhbarı</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">İletişim Bilgisi (Zorunlu)*</label>
          <input 
            type="text" 
            required 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            placeholder="Telefon veya E-posta"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">İhbar Türü</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="YARALI">Yaralı</option>
            <option value="SAHIPSIZ">Sahipsiz</option>
            <option value="DIGER">Diğer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fotoğraf (JPEG, Max 5MB)</label>
          <input 
            type="file" 
            accept="image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Not / Açıklama</label>
          <textarea 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-pink-500 text-white p-2 rounded-md hover:bg-pink-600 transition"
        >
          İhbar Gönder
        </button>
      </form>
    </div>
  );
}