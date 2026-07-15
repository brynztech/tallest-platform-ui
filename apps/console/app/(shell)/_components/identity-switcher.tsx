'use client'

import { ChevronsUpDown } from 'lucide-react'
import {
  ROLE_LABELS,
  useActingUser,
  useIdentityContext,
} from '@brynzit/identity'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { Badge } from '@brynzit/ui/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@brynzit/ui/components/ui/dropdown-menu'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Acting-as identity switcher (top-right).
 *
 * There is no real authentication yet (trusted-network tool). Switching the
 * acting user changes which capabilities are active across the console. When
 * real auth ships, this control is removed and the acting user comes from the
 * session — the capability seam (`useCan`) is unaffected.
 */
export function IdentitySwitcher() {
  const actingUser = useActingUser()
  const { users, setActingUser } = useIdentityContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-2 pr-2.5 text-left shadow-sm shadow-slate-200/60 transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Switch acting user"
      >
        <Avatar size="sm">
          <AvatarFallback>{initials(actingUser.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-semibold leading-4">{actingUser.name}</span>
          <span className="text-muted-foreground truncate text-[11px] leading-4">
            {ROLE_LABELS[actingUser.role]}
          </span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>Switch identity</span>
          <span className="text-muted-foreground text-[11px] font-normal">
            No login yet — acts as the selected user
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={actingUser.id} onValueChange={setActingUser}>
          {users.map((user) => (
            <DropdownMenuRadioItem
              key={user.id}
              value={user.id}
              className="flex items-center gap-2 py-2 pr-2"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium leading-4">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs leading-4">
                  {user.email}
                </span>
              </span>
              <Badge variant="secondary" className="shrink-0">
                {ROLE_LABELS[user.role]}
              </Badge>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
