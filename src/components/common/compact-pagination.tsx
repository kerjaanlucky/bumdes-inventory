'use client'

import { useMemo } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface CompactPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

function getPageList(
  page: number,
  totalPages: number,
  siblingCount: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, totalPages, page])
  for (let i = 1; i <= siblingCount; i++) {
    if (page - i > 1) pages.add(page - i)
    if (page + i < totalPages) pages.add(page + i)
  }
  if (page <= 3) {
    pages.add(2)
    pages.add(3)
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
  }
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export function CompactPagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: CompactPaginationProps) {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotal)
  const pageList = useMemo(
    () => getPageList(safePage, safeTotal, siblingCount),
    [safePage, safeTotal, siblingCount],
  )

  const goTo = (e: React.MouseEvent, target: number) => {
    e.preventDefault()
    if (target < 1 || target > safeTotal || target === safePage) return
    onPageChange(target)
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={(e) => goTo(e, safePage - 1)}
            aria-disabled={safePage <= 1}
            className={safePage <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pageList.map((p, idx) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href='#'
                onClick={(e) => goTo(e, p)}
                isActive={p === safePage}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={(e) => goTo(e, safePage + 1)}
            aria-disabled={safePage >= safeTotal}
            className={
              safePage >= safeTotal ? 'pointer-events-none opacity-50' : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
