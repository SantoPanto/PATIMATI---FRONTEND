import React, { useState } from "react";

interface ReportItem {
  id: number;
  title: string;
  status: "YENI" | "ISLEME_ALINDI" | "TAMAMLANDI";
  date: string;
  location: string;
}

const mockReports: ReportItem[] = [
  { id: 1, title: "Yaralı Kedi İhbarı", status: "YENI", date: "2026-08-26", location: "Nilüfer" },
  { id: 2, title: "Sahipsiz Köpek Sürüsü", status: "ISLEME_ALINDI", date: "2026-08-25", location: "Osmangazi" },
  { id: 3, title: "Beslenme Odağı Talebi", status: "TAMAMLANDI", date: "2026-08-20", location: "Yıldırım" },
];

export default function MunicipalityReportQueuePage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");

  const filteredReports = mockReports.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesDate = !dateFilter || item.date === dateFilter;
    return matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "YENI":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Yeni İhbar</span>;
      case "ISLEME_ALINDI":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">İşleme Alındı</span>;
      case "TAMAMLANDI":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Tamamlandı</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Belediye İhbar Kuyruk Paneli</h1>
      
      {/* Filtre Alanı */}
      <div className="flex gap-4 mb-4 bg-gray-50 p-3 rounded border">
        <div>
          <label className="block text-xs font-medium mb-1">Duruma Göre Filtrele</label>
          <select
            className="border p-2 rounded text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tümü</option>
            <option value="YENI">Yeni</option>
            <option value="ISLEME_ALINDI">İşleme Alındı</option>
            <option value="TAMAMLANDI">Tamamlandı</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Tarihe Göre Filtrele</label>
          <input
            type="date"
            className="border p-2 rounded text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-sm">ID</th>
              <th className="p-3 text-sm">Başlık</th>
              <th className="p-3 text-sm">Konum</th>
              <th className="p-3 text-sm">Tarih</th>
              <th className="p-3 text-sm">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">#{report.id}</td>
                  <td className="p-3 text-sm font-medium">{report.title}</td>
                  <td className="p-3 text-sm">{report.location}</td>
                  <td className="p-3 text-sm">{report.date}</td>
                  <td className="p-3 text-sm">{getStatusBadge(report.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Filtreye uygun kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}