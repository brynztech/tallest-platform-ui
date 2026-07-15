'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bookmark, BookmarkX } from 'lucide-react'
import { useActingUser } from '@brynzit/identity'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import {
  bookmarkQueryKeys,
  deleteBookmark,
  fetchBookmarks,
} from '../_lib/bookmarks'

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

export default function BookmarksPage() {
  const actingUser = useActingUser()
  const queryClient = useQueryClient()

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: bookmarkQueryKeys.list(actingUser.id),
    queryFn: () => fetchBookmarks(actingUser.id),
    staleTime: 15 * 1000,
  })

  const removeMutation = useMutation({
    mutationFn: (candidateId: string) => deleteBookmark({ userId: actingUser.id, candidateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.list(actingUser.id) })
      toast('Removed bookmark.')
    },
    onError: () => toast.error('Could not remove bookmark — try again.'),
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-2 flex items-center gap-2">
        <Bookmark className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">Bookmarks</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Strong candidates you saved as {actingUser.name}. Bookmarks are personal to each recruiter.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Bookmark className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground">
            Open a candidate and use the Bookmark button to save them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.candidateId}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {bookmark.candidateName ?? shortId(bookmark.candidateId)}
                </p>
                {bookmark.note && (
                  <p className="truncate text-xs text-muted-foreground">{bookmark.note}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(bookmark.candidateId)}
              >
                <BookmarkX className="mr-1 size-4" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
