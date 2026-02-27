import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ListLoadingSkeletonProps {
  isMobile: boolean;
  title: string;
  tableColumns: number;
  mainClassName?: string;
  showFilters?: boolean;
  showActionButton?: boolean;
}

const ListLoadingSkeleton: React.FC<ListLoadingSkeletonProps> = ({
  isMobile,
  title,
  tableColumns,
  mainClassName = 'p-6',
  showFilters = true,
  showActionButton = false,
}) => {
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className={`flex-1 ${mainClassName}`}>
          <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
            <div className="flex-shrink-0 bg-background border-b border-border px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="flex items-center gap-2 w-full">
                <Skeleton className="h-10 w-full rounded-lg" />
                {showActionButton && <Skeleton className="h-10 w-10 rounded-lg" />}
              </div>
              {showFilters && (
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3 bg-background">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={`${title}-mobile-skeleton-${idx}`} className="bg-card border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-4 w-11/12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-4 w-8/12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-4 w-7/12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const columns = Math.max(6, Math.min(10, tableColumns));

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-1 ${mainClassName}`}>
        <div className="space-y-6 pb-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-sm" />
              <Skeleton className="h-6 w-60" />
            </div>
            <Skeleton className="h-10 w-72 rounded-lg" />
          </div>

          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="bg-muted border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    {Array.from({ length: columns }).map((_, idx) => (
                      <Skeleton
                        key={`${title}-head-skeleton-${idx}`}
                        className={idx === 0 ? 'h-4 w-8' : 'h-4 flex-1'}
                      />
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 8 }).map((_, rowIdx) => (
                    <div key={`${title}-row-skeleton-${rowIdx}`} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {Array.from({ length: columns }).map((_, colIdx) => (
                          <Skeleton
                            key={`${title}-cell-skeleton-${rowIdx}-${colIdx}`}
                            className={colIdx === 0 ? 'h-6 w-8 rounded-md' : 'h-4 flex-1'}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ListLoadingSkeleton;
