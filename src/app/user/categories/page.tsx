import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Database } from "lucide-react"

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Kategori Produk</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Kategori</CardTitle>
          <CardDescription>
            Kelola kategori untuk produk Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <Database className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                  Segera Hadir
                </h3>
                <p className="text-sm text-muted-foreground">
                  Anda akan dapat mengelola kategori produk di sini.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
