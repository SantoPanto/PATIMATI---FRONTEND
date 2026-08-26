import React, { useState } from 'react';

// Örnek ihbar veri tipi
interface Report {
  id: number;
  reporterContact: string;
  type: string;
  note: string;
  status: 'YENI' | 'ISLEME_ALINDI' | 'TAMAMLANDI';
  createdAt: string;
}

export default function MunicipalityReportQueuePage() {
  // Örnek başlangıç verisi (Backend /api/municipality/reports ucu bağlanacak)
  const [reports, setReports] = useState<Report[]>([
    { id: 1, reporterContact: '05551112233', type: 'YARALI', note: 'Ayağından yaralı köpeksiz sokakta.', status: 'YENI', createdAt: '2026-08-26' },
    { id: 2, reporterContact: 'ornek@mail.com', type: 'SAHIPSIZ', note: 'Bahçede 2 sahipsiz yavru var.', status: 'ISLEME_ALINDI', createdAt: '2026-08-25' }
  ]);

  const handleStatusChange = (id: number, newStatus: Report['status']) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    // Backend PATCH /api/municipality/reports/{id}/status ucu buraya eklenecek[cite: 1]
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-pink-600">Belediye İhbar Kuyruğu</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reporterContact}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                    {report.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{report.note}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                  {report.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    onClick={() => handleStatusChange(report.id, 'YENI')} 
                    className="text-yellow-600 hover:text-yellow-900 border px-2 py-1 rounded text-xs"
                  >
                    Yeni
                  </button>
                  <button 
                    onClick={() => handleStatusChange(report.id, 'ISLEME_ALINDI')} 
                    className="text-blue-600 hover:text-blue-900 border px-2 py-1 rounded text-xs"
                  >
                    İşleme Al
                  </button>
                  <button 
                    onClick={() => handleStatusChange(report.id, 'TAMAMLANDI')} 
                    className="text-green-600 hover:text-green-900 border px-2 py-1 rounded text-xs"
                  >
                    Tamamla
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}