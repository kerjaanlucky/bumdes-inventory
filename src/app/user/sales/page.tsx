"use client";

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
import { sales } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link";

export default function SalesPage() {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Selesai":
                return "default"
            case "Tertunda":
                return "secondary"
            case "Dibatalkan":
                return "destructive"
            default:
                return "outline"
        }
    }

    const salesStatusIndo = (status: string) => {
        switch (status) {
            case "Completed":
                return "Selesai";
            case "Pending":
                return "Tertunda";
            case "Canceled":
                return "Dibatalkan";
            default:
                return status;
        }
    }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Penjualan</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/user/sales/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Penjualan Baru
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Transaksi Penjualan</CardTitle>
            <CardDescription>Catat dan kelola penjualan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID Penjualan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>
                    <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sales.map(sale => (
                    <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.id}</TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(salesStatusIndo(sale.status))}>{salesStatusIndo(sale.status)}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{sale.date}</TableCell>
                        <TableCell className="text-right">Rp{sale.total.toLocaleString('id-ID')}</TableCell>
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
                            <DropdownMenuItem>Buat Faktur</DropdownMenuItem>
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
