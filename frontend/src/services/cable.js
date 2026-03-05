import { createConsumer } from '@rails/actioncable'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const wsUrl = apiBase.replace(/^http/, 'ws') + '/cable'

export default createConsumer(wsUrl)
