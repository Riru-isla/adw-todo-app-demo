import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { fetchTasks, updateTask } from '../services/api'

// Mock del servicio API
vi.mock('../services/api', () => ({
  fetchTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
  updateTask: vi.fn().mockResolvedValue({}),
  deleteTask: vi.fn(),
  reorderTasks: vi.fn().mockResolvedValue([])
}))

// Mock de Action Cable
const { mockUnsubscribe, mockSubscriptionsCreate } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn()
  const mockSubscriptionsCreate = vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
  return { mockUnsubscribe, mockSubscriptionsCreate }
})

vi.mock('../services/cable', () => ({
  default: {
    subscriptions: {
      create: mockSubscriptionsCreate
    }
  }
}))

test('renders Todo List heading', () => {
  render(<App />)
  const heading = screen.getByRole('heading', { name: /todo list/i })
  expect(heading).toBeInTheDocument()
})

test('renders task form', () => {
  render(<App />)
  expect(screen.getByPlaceholderText(/nueva tarea/i)).toBeInTheDocument()
})

test('renders task list', () => {
  render(<App />)
  expect(screen.getByText(/no hay tareas/i)).toBeInTheDocument()
})

test('toggle calls updateTask with completed: true when task is not completed', async () => {
  fetchTasks.mockResolvedValue([{ id: 1, title: 'Test task', completed: false }])

  render(<App />)
  const checkbox = await screen.findByRole('checkbox')
  fireEvent.click(checkbox)

  await waitFor(() => {
    expect(updateTask).toHaveBeenCalledWith(1, { completed: true })
  })
})

test('toggle calls updateTask with completed: false when task is completed', async () => {
  fetchTasks.mockResolvedValue([{ id: 1, title: 'Test task', completed: true }])

  render(<App />)
  const checkbox = await screen.findByRole('checkbox')
  fireEvent.click(checkbox)

  await waitFor(() => {
    expect(updateTask).toHaveBeenCalledWith(1, { completed: false })
  })
})

test('subscribes to TasksChannel on mount', () => {
  render(<App />)
  expect(mockSubscriptionsCreate).toHaveBeenCalledWith('TasksChannel', expect.objectContaining({
    received: expect.any(Function)
  }))
})

test('adds task to list when receiving created broadcast', async () => {
  fetchTasks.mockResolvedValue([])
  let receivedCallback

  mockSubscriptionsCreate.mockImplementation((_channel, handlers) => {
    receivedCallback = handlers.received
    return { unsubscribe: mockUnsubscribe }
  })

  render(<App />)
  await screen.findByText(/no hay tareas/i)

  receivedCallback({ action: 'created', task: { id: 99, title: 'Tarea remota', completed: false } })

  await waitFor(() => {
    expect(screen.getByText('Tarea remota')).toBeInTheDocument()
  })
})

test('updates task in list when receiving updated broadcast', async () => {
  fetchTasks.mockResolvedValue([{ id: 1, title: 'Original', completed: false }])
  let receivedCallback

  mockSubscriptionsCreate.mockImplementation((_channel, handlers) => {
    receivedCallback = handlers.received
    return { unsubscribe: mockUnsubscribe }
  })

  render(<App />)
  await screen.findByText('Original')

  receivedCallback({ action: 'updated', task: { id: 1, title: 'Original', completed: true } })

  await waitFor(() => {
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
