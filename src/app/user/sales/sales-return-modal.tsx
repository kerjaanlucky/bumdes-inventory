'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sale } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const returnLineSchema = z.object({
  item_id: z.any(),
  produk_id: z.string(),
  nama_produk: z.string(),
  nama_satuan: z.string(),
  jumlah: z.number(),
  jumlah_diretur_sebelumnya: z.number(),
  sisa: z.number(),
  harga_net_satuan: z.number(),
  jumlah_retur_sekarang: z.coerce.number().min(0, 'Qty tidak boleh negatif'),
})

const returnSchema = z
  .object({
    lines: z.array(returnLineSchema),
    note: z.string().min(1, 'Alasan retur wajib diisi.'),
  })
  .refine((v) => v.lines.some((l) => l.jumlah_retur_sekarang > 0), {
    message: 'Minimal 1 barang dengan qty retur > 0.',
    path: ['lines'],
  })
  .refine((v) => v.lines.every((l) => l.jumlah_retur_sekarang <= l.sisa), {
    message: 'Qty retur tidak boleh melebihi sisa yang dapat diretur.',
    path: ['lines'],
  })

export type SaleReturnFormValues = z.infer<typeof returnSchema>

interface SalesReturnModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale
  isSubmitting?: boolean
  onSubmit: (
    lines: { item_id: any; produk_id: string; jumlah_retur: number }[],
    note: string,
  ) => Promise<void>
}

export function SalesReturnModal({
  isOpen,
  onClose,
  sale,
  isSubmitting = false,
  onSubmit,
}: SalesReturnModalProps) {
  const defaultLines = useMemo(
    () =>
      (sale.items || []).map((item) => {
        const already = item.jumlah_diretur || 0
        const sisa = Math.max(0, item.jumlah - already)
        const netUnit = item.harga_jual_satuan * (1 - (item.diskon || 0) / 100)
        return {
          item_id: item.id,
          produk_id: item.produk_id,
          nama_produk: item.nama_produk,
          nama_satuan: item.nama_satuan,
          jumlah: item.jumlah,
          jumlah_diretur_sebelumnya: already,
          sisa,
          harga_net_satuan: netUnit,
          jumlah_retur_sekarang: 0,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sale.id, sale.nomor_penjualan],
  )

  const form = useForm<SaleReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { lines: defaultLines, note: '' },
  })

  useEffect(() => {
    form.reset({ lines: defaultLines, note: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale.id, sale.nomor_penjualan])

  const { fields } = useFieldArray({ control: form.control, name: 'lines' })
  const watchedLines = form.watch('lines')

  const previewRefund = (watchedLines || []).reduce(
    (sum, l) =>
      sum + (l.jumlah_retur_sekarang || 0) * (l.harga_net_satuan || 0),
    0,
  )
  const previewQty = (watchedLines || []).reduce(
    (sum, l) => sum + (l.jumlah_retur_sekarang || 0),
    0,
  )

  const handleFormSubmit = async (data: SaleReturnFormValues) => {
    const lines = data.lines
      .filter((l) => l.jumlah_retur_sekarang > 0)
      .map((l) => ({
        item_id: l.item_id,
        produk_id: l.produk_id,
        jumlah_retur: Math.floor(l.jumlah_retur_sekarang),
      }))
    await onSubmit(lines, data.note.trim())
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className='max-w-3xl max-h-[85vh] flex flex-col overflow-hidden'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>Retur Per Item — {sale.nomor_penjualan}</DialogTitle>
          <DialogDescription>
            Pilih qty per barang yang dikembalikan pelanggan. Stok bertambah
            sesuai qty yang diproses, dan nominal refund dihitung dari harga net
            per item. Retur dapat dilakukan bertahap.
          </DialogDescription>
        </DialogHeader>

        {(sale.total_retur || 0) > 0 && (
          <div className='shrink-0 rounded-md border bg-muted/40 px-3 py-2 text-xs flex items-center justify-between'>
            <span className='text-muted-foreground'>
              Retur sebelumnya: Rp
              {(sale.total_retur || 0).toLocaleString('id-ID')}
            </span>
            <Badge variant='secondary'>LUNAS — retur sebagian</Badge>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden'
          >
            <div className='min-h-0 flex-1 overflow-y-auto rounded-md border pr-1'>
              <Table>
                <TableHeader className='sticky top-0 z-10 bg-background'>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className='text-right'>Terjual</TableHead>
                    <TableHead className='text-right'>Sudah Diretur</TableHead>
                    <TableHead className='text-right'>Sisa</TableHead>
                    <TableHead className='w-36 text-right'>
                      Retur Sekarang
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow
                      key={field.id}
                      className={field.sisa === 0 ? 'opacity-50' : ''}
                    >
                      <TableCell>
                        <div className='text-xs font-medium'>
                          {field.nama_produk}
                        </div>
                        <div className='text-[11px] text-muted-foreground font-mono'>
                          Rp{field.harga_net_satuan.toLocaleString('id-ID')} /{' '}
                          {field.nama_satuan} (net)
                        </div>
                      </TableCell>
                      <TableCell className='text-right text-xs font-mono'>
                        {field.jumlah} {field.nama_satuan}
                      </TableCell>
                      <TableCell className='text-right text-xs font-mono'>
                        {field.jumlah_diretur_sebelumnya}
                      </TableCell>
                      <TableCell className='text-right text-xs font-mono font-semibold'>
                        {field.sisa}
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.jumlah_retur_sekarang`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  max={field.sisa}
                                  step={1}
                                  disabled={isSubmitting || field.sisa === 0}
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(Number(e.target.value))
                                  }
                                  className='text-right'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {form.formState.errors.lines?.root && (
              <p className='shrink-0 text-sm font-medium text-destructive'>
                {form.formState.errors.lines.root.message}
              </p>
            )}

            <div className='shrink-0 space-y-4'>
            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Retur</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Contoh: 3 pcs pecah saat diterima, 1 pcs salah ukuran dikembalikan.'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                Estimasi refund retur ini ({previewQty} pcs)
              </span>
              <span className='font-semibold text-base'>
                Rp{Math.round(previewRefund).toLocaleString('id-ID')}
              </span>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Proses Retur
              </Button>
            </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
