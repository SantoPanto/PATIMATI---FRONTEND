export interface ReportPayload {
  title: string;
  description: string;
  location: string;
  petType?: string;
}

export const reportService = {
  async submitReport(data: ReportPayload): Promise<{ success: boolean; id: number }> {
    // Sahte API çağrısı simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, id: Math.floor(Math.random() * 1000) });
      }, 500);
    });
  },

  async getQueueReports(): Promise<any[]> {
    // Sahte kuyruk okuma fonksiyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, title: "Yaralı Kedi İhbarı", status: "YENI", date: "2026-08-26", location: "Nilüfer" },
          { id: 2, title: "Sahipsiz Köpek Sürüsü", status: "ISLEME_ALINDI", date: "2026-08-25", location: "Osmangazi" },
        ]);
      }, 500);
    });
  }
};