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
import { purchases } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PurchasesPage() {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Diterima":
                return "default"
            case "Dipesan":
                return "secondary"
            case "Tertunda":
                return "outline"
            default:
                return "outline"
        }
    }

    const purchaseStatusIndo = (status: string) => {
        switch (status) {
            case "Received":
                return "Diterima";
            case "Ordered":
                return "Dipesan";
            case "Pending":
                return "Tertunda";
            default:
                return status;
        }
    }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Pembelian</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Pesanan Pembelian Baru
                </span>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Pesanan Pembelian</CardTitle>
            <CardDescription>Lacak dan kelola stok masuk Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID Pesanan</TableHead>
                    <TableHead>Pemasok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>
                    <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {purchases.map(purchase => (
                    <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.id}</TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(purchaseStatusIndo(purchase.status))}>{purchaseStatusIndo(purchase.status)}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{purchase.date}</TableCell>
                        <TableCell className="text-right">Rp{purchase.total.toLocaleString('id-ID')}</TableCell>
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
                            <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                            <DropdownMenuItem>Tandai sebagai Diterima</DropdownMenuItem>
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
