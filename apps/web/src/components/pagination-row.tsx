import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type PaginationData = {
  totalPages: number;
  showFirst: boolean;
  showPrevEllipsis: boolean;
  visiblePages: number[];
  showNextEllipsis: boolean;
  showLast: boolean;
};

const getPaginationData = ({
  total,
  limit,
  currentPage,
}: {
  total: number;
  limit: number;
  currentPage: number;
}): PaginationData => {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) {
    return {
      totalPages,
      showFirst: false,
      showPrevEllipsis: false,
      visiblePages: [],
      showNextEllipsis: false,
      showLast: false,
    };
  }

  // If we have 5 or fewer pages, show all
  if (totalPages <= 5) {
    return {
      totalPages,
      showFirst: false,
      showPrevEllipsis: false,
      visiblePages: Array.from({ length: totalPages }, (_, i) => i + 1),
      showNextEllipsis: false,
      showLast: false,
    };
  }

  // For 6+ pages, use consistent layout to minimize shift
  const visiblePages: number[] = [];
  let showFirst = false;
  let showPrevEllipsis = false;
  let showNextEllipsis = false;
  let showLast = false;

  // Determine which scenario we're in
  if (currentPage <= 3) {
    // Near the beginning: show pages 1-4 or 1-5, then ellipsis, then last
    visiblePages.push(1, 2, 3, 4);
    if (currentPage === 3 || totalPages === 6) {
      visiblePages.push(5);
    }
    showNextEllipsis = true;
    showLast = true;
  } else if (currentPage >= totalPages - 2) {
    // Near the end: show first, ellipsis, then last 4-5 pages
    showFirst = true;
    showPrevEllipsis = true;
    const startPage = Math.max(totalPages - 4, 2);
    for (let i = startPage; i <= totalPages; i++) {
      visiblePages.push(i);
    }
  } else {
    // In the middle: show first, ellipsis, current-1/current/current+1, ellipsis, last
    showFirst = true;
    showPrevEllipsis = true;
    visiblePages.push(currentPage - 1, currentPage, currentPage + 1);
    showNextEllipsis = true;
    showLast = true;
  }

  return {
    totalPages,
    showFirst,
    showPrevEllipsis,
    visiblePages,
    showNextEllipsis,
    showLast,
  };
};

type PaginationRowProps = {
  total?: number;
  limit: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  type?: string;
  pageSizeOptions?: number[];
};

export const PaginationRow = ({
  total,
  limit,
  currentPage,
  onPageChange,
  onPageSizeChange,
  className,
  type = "assets",
  pageSizeOptions = [10, 20, 50, 100, 200],
}: PaginationRowProps) => {
  if (!total) return null;
  const paginationData = getPaginationData({ total, limit, currentPage });

  return (
    <div className={cn("col-span-full mt-6 flex items-center justify-between gap-5", className)}>
      <Select
        value={limit.toString()}
        onValueChange={(value) => {
          onPageSizeChange(Number(value));
        }}
      >
        <SelectTrigger className="min-w-fit">
          <SelectValue
            placeholder={`${limit} ${type} per page`}
            className="p-4"
          >
            {limit} {type} per page
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {pageSizeOptions.map((option) => (
              <SelectItem
                key={option}
                value={option.toString()}
              >
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {paginationData.totalPages > 1 && (
        <div className="flex flex-1 items-center justify-center gap-5">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (currentPage > 1) {
                      onPageChange(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* First page */}
              {paginationData.showFirst && (
                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === 1}
                    onClick={() => onPageChange(1)}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Previous ellipsis */}
              {paginationData.showPrevEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Visible pages */}
              {paginationData.visiblePages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Next ellipsis */}
              {paginationData.showNextEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {paginationData.showLast && (
                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === paginationData.totalPages}
                    onClick={() => onPageChange(paginationData.totalPages)}
                  >
                    {paginationData.totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (currentPage < paginationData.totalPages) {
                      onPageChange(currentPage + 1);
                    }
                  }}
                  className={
                    currentPage === paginationData.totalPages ?
                      "pointer-events-none opacity-50"
                    : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
            <div className="text-muted-foreground ml-3 flex min-w-fit items-center text-sm">
              {currentPage} - {limit} of {total}
            </div>
          </Pagination>
        </div>
      )}
    </div>
  );
};
