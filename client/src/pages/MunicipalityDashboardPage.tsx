import React, { useState } from 'react';

export default function MunicipalityDashboardPage() {
  // Örnek başlangıç verileri (Backend /api/municipality/dashboard ucu bağlanacak)
  const [stats, setStats] = useState({
    lostCount: 12,
    foundCount: 8,
    resolvedCount: 15,
    district: 'Nilüfer / Bursa'
  });

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-pink-600">Belediye Yönetim Paneli - {stats.district}</h2>
      
      {/* Sayaç Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-pink-50 p-4 rounded-lg shadow border border-pink-200">
          <p className="text-sm text-gray-600">Aktif Kayıp İlanları</p>
          <p className="text-3xl font-bold text-pink-700">{stats.lostCount}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <p className="text-sm text-gray-600">Bulunan Hayvanlar</p>
          <p className="text-3xl font-bold text-blue-700">{stats.foundCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <p className="text-sm text-gray-600">Sahibine Kavuşanlar</p>
          <p className="text-3xl font-bold text-green-700">{stats.resolvedCount}</p>
        </div>
      </div>

      {/* Isı Haritası Alanı */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Yoğunluk ve Isı Haritası Görünümü</h3>
        <div className="h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500">
          [Mevcut Harita Bileşeni ve Isı Katmanı Burada Yer Alacak]
        </div>
      </div>
    </div>
  );
}