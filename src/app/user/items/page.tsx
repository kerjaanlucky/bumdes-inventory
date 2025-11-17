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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { items } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ItemsPage() {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Tersedia":
                return "default"
            case "Stok Rendah":
                return "secondary"
            case "Habis":
                return "destructive"
            default:
                return "outline"
        }
    }
    
    const itemStatusIndo = (status: string) => {
        switch (status) {
            case "In Stock":
                return "Tersedia"
            case "Low Stock":
                return "Stok Rendah"
            case "Out of Stock":
                return "Habis"
            default:
                return status
        }
    }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Master Barang</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Tambah Barang
                </span>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Barang</CardTitle>
            <CardDescription>Kelola produk Anda dan lihat status inventarisnya.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead className="hidden md:table-cell">Stok</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead>
                    <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(itemStatusIndo(item.status))}>{itemStatusIndo(item.status)}</Badge>
                        </TableCell>
                        <TableCell>Rp{item.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.stock}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.category}</TableCell>
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
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
