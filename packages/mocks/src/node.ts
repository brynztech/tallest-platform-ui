import { setupServer } from 'msw/node'
import { bdHandlers } from './handlers/bd'
import { opsHandlers } from './handlers/ops'
import { supplyHandlers } from './handlers/supply'
import { monitoringHandlers } from './handlers/monitoring'
import { candidateHandlers } from './handlers/candidate'

export const server = setupServer(
  ...bdHandlers,
  ...opsHandlers,
  ...supplyHandlers,
  ...monitoringHandlers,
  ...candidateHandlers,
)
