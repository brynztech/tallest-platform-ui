import { setupServer } from 'msw/node'
import { bdHandlers } from './handlers/bd'
import { opsHandlers } from './handlers/ops'
import { supplyHandlers } from './handlers/supply'
import { monitoringHandlers } from './handlers/monitoring'
import { candidateHandlers } from './handlers/candidate'
import { qualityHandlers } from './handlers/quality'
import { bookmarkHandlers } from './handlers/bookmarks'
import { assignmentHandlers } from './handlers/assignments'

export const server = setupServer(
  ...bdHandlers,
  ...opsHandlers,
  ...supplyHandlers,
  ...monitoringHandlers,
  ...candidateHandlers,
  ...qualityHandlers,
  ...bookmarkHandlers,
  ...assignmentHandlers,
)
