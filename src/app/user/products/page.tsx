import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { products } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Product } from "@/lib/types"

export default function ProductsPage() {
    const getStatus = (stock: number): { text: string; variant: "default" | "secondary" | "destructive" } => {
        if (stock <= 0) {
            return { text: "Habis", variant: "destructive" };
        }
        if (stock < 10) {
            return { text: "Stok Rendah", variant: "secondary" };
        }
        return { text: "Tersedia", variant: "default" };
    }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Manajemen Produk</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Tambah Produk
                </span>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Produk</CardTitle>
            <CardDescription>Kelola produk Anda dan lihat status inventarisnya.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead className="hidden md:table-cell">Harga Modal</TableHead>
                    <TableHead className="hidden md:table-cell">Stok</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead>
                    <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {products.map((product: Product) => {
                    const status = getStatus(product.stok);
                    return (
                        <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs">{product.kode_produk}</TableCell>
                            <TableCell className="font-medium">{product.nama_produk}</TableCell>
                            <TableCell>
                                <Badge variant={status.variant}>{status.text}</Badge>
                            </TableCell>
                            <TableCell>Rp{product.harga_jual.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="hidden md:table-cell">Rp{product.harga_modal.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="hidden md:table-cell">{product.stok} {product.nama_satuan}</TableCell>
                            <TableCell className="hidden md:table-cell">{product.nama_kategori}</TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Buka menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem>Ubah</DropdownMenuItem>
                                <DropdownMenuItem>Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
