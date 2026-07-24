import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-28 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-28 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-4">
            <div className="flex justify-between">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
