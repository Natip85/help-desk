import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TicketCardSkeleton = () => {
  return (
    <Card className="group border-primary flex flex-row justify-between border-l-3 p-6 shadow-lg">
      <CardHeader className="flex flex-1 flex-row items-center gap-4 py-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/5" />
          <div className="flex flex-row items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex items-center gap-2 p-0">
        <Skeleton className="h-8 w-[120px] rounded-md" />
      </CardContent>

      <CardFooter className="flex-col justify-center p-0">
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardFooter>
    </Card>
  );
};
