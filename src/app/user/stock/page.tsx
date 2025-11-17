import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { History } from "lucide-react"

export default function StockPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Manajemen Stok</h1>
      <Card>
        <CardHeader>
          <CardTitle>Level Stok</CardTitle>
          <CardDescription>
            Tingkat stok saat ini untuk setiap barang di cabang Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <History className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                  Riwayat stok segera hadir
                </h3>
                <p className="text-sm text-muted-foreground">
                  Anda akan dapat melihat riwayat stok terperinci di sini.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
