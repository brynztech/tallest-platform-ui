export function shortlistStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-[oklch(0.45_0.15_145)/20] text-[oklch(0.45_0.15_145)] border-[oklch(0.45_0.15_145)/40]'
    case 'hold':
      return 'border-[oklch(0.769_0.188_85.87)] text-[oklch(0.769_0.188_85.87)]'
    case 'passed':
      return 'text-muted-foreground border-border'
    default:
      return ''
  }
}
