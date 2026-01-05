import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
    showColumnsButton?: boolean;
    rowCount?: number;
    columnCount?: number;
}

export function TableSkeleton({
    showColumnsButton = true,
    rowCount = 3,
    columnCount = 2
}: TableSkeletonProps) {
    const gapSize = Math.max(16, 32 - (columnCount * 8));

    return (
        <>
            {showColumnsButton && (
                <div className="flex justify-end mt-5">
                    <Skeleton className="h-8 w-[100px]" />
                </div>
            )}
            <div className="rounded-md border">
                {[...Array(rowCount)].map((_, i) => (
                    <div key={i} className="border-b p-4">
                        <div className={`grid gap-${gapSize}`} style={{ gridTemplateColumns: `200px repeat(${columnCount}, 1fr)` }}>
                            {[...Array(columnCount)].map((_, j) => (
                                <Skeleton key={j} className="h-6 w-[180px]" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}