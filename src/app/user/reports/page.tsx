import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan</CardTitle>
          <CardDescription>
            Buat laporan tentang tingkat stok, riwayat pembelian, dan data penjualan.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                  Mesin pelaporan segera hadir
                </h3>
                <p className="text-sm text-muted-foreground">
                  Anda akan dapat membuat dan mengekspor laporan di sini.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
