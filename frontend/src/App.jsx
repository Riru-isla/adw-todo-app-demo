import { useState, useEffect } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import { fetchTasks, createTask, updateTask, deleteTask, reorderTasks } from './services/api'
import consumer from './services/cable'

function App() {
  const [tasks, setTasks] = useState([])

  // Cargar tareas al montar el componente
  useEffect(() => {
    loadTasks()
  }, [])

  // Suscribirse al canal de Action Cable
  useEffect(() => {
    const subscription = consumer.subscriptions.create('TasksChannel', {
      received(data) {
        if (data.action === 'created') {
          setTasks(prev => {
            if (prev.some(t => t.id === data.task.id)) return prev
            return [...prev, data.task]
          })
        } else if (data.action === 'updated') {
          setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t))
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadTasks = async () => {
    const data = await fetchTasks()
    setTasks(data)
  }

  const handleCreateTask = async (title) => {
    const newTask = await createTask(title)
    setTasks([...tasks, newTask])
  }

  const handleToggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    await updateTask(id, { completed: !task.completed })
  }

  const handleDeleteTask = async (id) => {
    await deleteTask(id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const handleReorderTasks = async (taskIds) => {
    const reordered = taskIds.map(id => tasks.find(t => t.id === id))
    setTasks(reordered)
    await reorderTasks(taskIds)
  }

  return (
    <div className="app">
      <h1>Todo List</h1>
      <TaskForm onTaskCreated={handleCreateTask} />
      <TaskList
        tasks={tasks}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
        onReorder={handleReorderTasks}
      />
    </div>
  )
}

export default App
