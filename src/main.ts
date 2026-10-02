import * as XLSX from 'xlsx'
import './style.css'

type Priority = 'Alta' | 'Media' | 'Baja'
type Status = 'Pendiente' | 'En progreso' | 'Completada'
type Task = {
  id: string
  title: string
  subject: string
  dueAt: string
  priority: Priority
  status: Status
  createdAt: string
  updatedAt: string
}
type Backup = { version: 1; exportedAt: string; tasks: Task[] }

const storageKey = 'taskminddata1'
const app = document.querySelector<HTMLDivElement>('#app')!
let tasks: Task[] = []
let storageError = ''
let toastTimer = 0
const filters = { search: '', status: '', subject: '', priority: '' }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.title === 'string' && item.title.trim().length > 0 &&
    typeof item.subject === 'string' && item.subject.trim().length > 0 &&
    typeof item.dueAt === 'string' && Number.isFinite(new Date(item.dueAt).getTime()) &&
    ['Alta', 'Media', 'Baja'].includes(String(item.priority)) &&
    ['Pendiente', 'En progreso', 'Completada'].includes(String(item.status)) &&
    typeof item.createdAt === 'string' && typeof item.updatedAt === 'string'
}

function readTasks(): Task[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('El respaldo local no tiene un formato válido')
    const data = parsed as Partial<Backup>
    if (data.version !== 1 || !Array.isArray(data.tasks) || !data.tasks.every(isTask)) throw new Error('Los datos guardados no tienen un formato válido')
    return data.tasks
  } catch {
    storageError = 'No se pudieron leer los datos locales. Puedes restaurar un respaldo JSON.'
    return []
  }
}

function saveTasks(next: Task[]): boolean {
  try {
    const data: Backup = { version: 1, exportedAt: new Date().toISOString(), tasks: next }
    localStorage.setItem(storageKey, JSON.stringify(data))
    tasks = next
    storageError = ''
    return true
  } catch {
    storageError = 'No se pudo guardar en este navegador. Revisa el espacio disponible y vuelve a intentarlo.'
    render()
    return false
  }
}

function dueState(task: Task): 'done' | 'overdue' | 'soon' | 'normal' {
  if (task.status === 'Completada') return 'done'
  const remaining = new Date(task.dueAt).getTime() - Date.now()
  if (remaining < 0) return 'overdue'
  if (remaining <= 48 * 60 * 60 * 1000) return 'soon'
  return 'normal'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function filteredTasks(): Task[] {
  const query = filters.search.trim().toLocaleLowerCase('es')
  return tasks.filter(task =>
    (!query || `${task.title} ${task.subject}`.toLocaleLowerCase('es').includes(query)) &&
    (!filters.status || task.status === filters.status) &&
    (!filters.subject || task.subject === filters.subject) &&
    (!filters.priority || task.priority === filters.priority)
  ).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}

function taskCard(task: Task): string {
  const state = dueState(task)
  const deadline = state === 'overdue' ? 'Vencida' : state === 'soon' ? 'Próxima a vencer' : ''
  return `<article class="taskcard ${state}">
    <div class="tasktop"><span class="subject">${escapeHtml(task.subject)}</span><span class="priority ${task.priority.toLowerCase()}">${task.priority}</span></div>
    <h3>${escapeHtml(task.title)}</h3>
    <div class="taskbottom"><div class="taskmeta"><span class="date">Entrega ${escapeHtml(formatDate(task.dueAt))}</span>${deadline ? `<span class="deadline">${deadline}</span>` : ''}</div>
    <div class="taskactions"><select aria-label="Estado de ${escapeHtml(task.title)}" data-status="${escapeHtml(task.id)}"><option ${task.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option><option ${task.status === 'En progreso' ? 'selected' : ''}>En progreso</option><option ${task.status === 'Completada' ? 'selected' : ''}>Completada</option></select><button type="button" class="textbutton" data-edit="${escapeHtml(task.id)}">Editar</button><button type="button" class="textbutton dangertext" data-delete="${escapeHtml(task.id)}">Eliminar</button></div></div>
  </article>`
}

function render(): void {
  const shown = filteredTasks()
  const completed = tasks.filter(task => task.status === 'Completada').length
  const overdue = tasks.filter(task => dueState(task) === 'overdue').length
  const soon = tasks.filter(task => dueState(task) === 'soon').length
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const subjects = [...new Set(tasks.map(task => task.subject))].sort((a, b) => a.localeCompare(b, 'es'))
  app.innerHTML = `
    <header class="siteheader"><div class="shell headerinner"><div class="brand">TaskMind</div><span class="headnote">Tus datos están en este navegador</span><div class="headeractions"><button type="button" class="quietbutton" id="exportJson">Respaldar JSON</button><button type="button" class="quietbutton" id="exportXls">Descargar XLS</button><button type="button" class="quietbutton" id="importButton">Importar JSON</button><input id="importFile" type="file" accept="application/json,.json" hidden /></div></div></header>
    <main class="shell">
      <section class="hero"><div><p class="eyebrow">AGENDA DE ESTUDIO</p><h1>Tareas académicas</h1><p class="herocopy">Revisa tus entregas y registra lo que falta por hacer.</p></div><button type="button" class="primarybutton" id="newTask">Nueva tarea</button></section>
      ${storageError ? `<div class="notice" role="alert">${escapeHtml(storageError)}</div>` : ''}
      <section class="stats" aria-label="Resumen de tareas"><div class="stat"><span>Total de tareas</span><strong>${tasks.length}</strong></div><div class="stat"><span>Completadas</span><strong>${percent}%</strong><small>${completed} de ${tasks.length}</small></div><div class="stat"><span>Próximas a vencer</span><strong>${soon}</strong><small>En las siguientes 48 horas</small></div><div class="stat"><span>Vencidas</span><strong>${overdue}</strong><small>Requieren atención</small></div></section>
      <section class="workspace"><div class="sectionheading"><h2>Lista de tareas</h2><span class="resultcount">${shown.length} ${shown.length === 1 ? 'resultado' : 'resultados'}</span></div>
      <div class="filters"><label class="searchfield"><span>Buscar</span><input id="search" type="search" placeholder="Título o materia" value="${escapeHtml(filters.search)}" /></label><label><span>Estado</span><select id="statusFilter"><option value="">Todos</option>${['Pendiente', 'En progreso', 'Completada'].map(value => `<option ${filters.status === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>Materia</span><select id="subjectFilter"><option value="">Todas</option>${subjects.map(value => `<option ${filters.subject === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label><label><span>Prioridad</span><select id="priorityFilter"><option value="">Todas</option>${['Alta', 'Media', 'Baja'].map(value => `<option ${filters.priority === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><button type="button" class="clearbutton" id="clearFilters">Limpiar filtros</button></div>
      <div class="listheading"><span>Ordenadas por entrega más próxima</span></div>
      <div class="tasklist">${shown.length ? shown.map(taskCard).join('') : `<div class="empty"><div class="emptyicon" aria-hidden="true">✓</div><h3>${tasks.length ? 'No hay tareas con estos filtros' : 'Tu agenda comienza aquí'}</h3><p>${tasks.length ? 'Prueba con otra búsqueda o limpia los filtros.' : 'Agrega tu primera tarea para ver tus próximas entregas.'}</p>${tasks.length ? '' : '<button type="button" class="primarybutton" id="emptyNewTask">Crear tarea</button>'}</div>`}</div></section>
      <footer>TaskMind guarda tus tareas en este dispositivo. Descarga respaldos JSON con frecuencia.</footer>
    </main>
    <dialog id="taskDialog"><form id="taskForm"><div class="dialoghead"><div><p class="eyebrow">TU AGENDA</p><h2 id="dialogTitle">Nueva tarea</h2></div><button type="button" class="closebutton" id="closeDialog" aria-label="Cerrar">×</button></div><input type="hidden" name="id" /><label>Título<input name="title" maxlength="120" required placeholder="Ejemplo: Entregar ensayo" /></label><label>Materia o asignatura<input name="subject" maxlength="80" required placeholder="Ejemplo: Historia" /></label><label>Fecha y hora de entrega<input name="dueAt" type="datetime-local" required /></label><div class="formrow"><label>Prioridad<select name="priority"><option>Alta</option><option selected>Media</option><option>Baja</option></select></label><label>Estado<select name="status"><option selected>Pendiente</option><option>En progreso</option><option>Completada</option></select></label></div><div class="dialogactions"><button type="button" class="quietbutton" id="cancelDialog">Cancelar</button><button type="submit" class="primarybutton">Guardar tarea</button></div></form></dialog><div id="toast" role="status" aria-live="polite"></div>`
}

function showToast(message: string): void {
  const element = document.querySelector<HTMLDivElement>('#toast')!
  element.textContent = message
  element.classList.add('visible')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => element.classList.remove('visible'), 3500)
}

function openDialog(task?: Task): void {
  const dialog = document.querySelector<HTMLDialogElement>('#taskDialog')!
  const form = document.querySelector<HTMLFormElement>('#taskForm')!
  form.reset()
  const field = (name: string): HTMLInputElement | HTMLSelectElement => form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement
  field('id').value = task?.id || ''
  field('title').value = task?.title || ''
  field('subject').value = task?.subject || ''
  field('dueAt').value = task?.dueAt || ''
  field('priority').value = task?.priority || 'Media'
  field('status').value = task?.status || 'Pendiente'
  document.querySelector('#dialogTitle')!.textContent = task ? 'Editar tarea' : 'Nueva tarea'
  dialog.showModal()
  field('title').focus()
}

function download(content: BlobPart, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function exportJson(): void {
  const backup: Backup = { version: 1, exportedAt: new Date().toISOString(), tasks }
  download(JSON.stringify(backup, null, 2), 'taskmindrespaldo.json', 'application/json')
  showToast('Respaldo JSON descargado')
}

function exportXls(): void {
  const rows = tasks.map(task => ({ Título: task.title, Materia: task.subject, Entrega: formatDate(task.dueAt), Prioridad: task.priority, Estado: task.status }))
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ['Título', 'Materia', 'Entrega', 'Prioridad', 'Estado'] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tareas')
  const bytes = XLSX.write(workbook, { bookType: 'xls', type: 'array' })
  download(bytes, 'taskmindtareas.xls', 'application/vnd.ms-excel')
  showToast('Archivo XLS descargado')
}

async function importJson(file: File): Promise<void> {
  try {
    const parsed: unknown = JSON.parse(await file.text())
    if (!parsed || typeof parsed !== 'object') throw new Error('Formato inválido')
    const backup = parsed as Partial<Backup>
    if (backup.version !== 1 || !Array.isArray(backup.tasks) || !backup.tasks.every(isTask)) throw new Error('Formato inválido')
    const ids = new Set(backup.tasks.map(task => task.id))
    if (ids.size !== backup.tasks.length) throw new Error('Hay tareas duplicadas')
    if (!window.confirm(`El archivo contiene ${backup.tasks.length} tareas. Reemplazará las ${tasks.length} tareas actuales de este navegador. ¿Deseas continuar?`)) return
    if (saveTasks(backup.tasks)) {
      render()
      showToast('Respaldo importado correctamente')
    }
  } catch {
    showToast('El archivo JSON no es un respaldo válido de TaskMind')
  }
}

app.addEventListener('click', event => {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLElement>('button')
  if (!button) return
  if (button.id === 'newTask' || button.id === 'emptyNewTask') openDialog()
  if (button.id === 'closeDialog' || button.id === 'cancelDialog') document.querySelector<HTMLDialogElement>('#taskDialog')!.close()
  if (button.id === 'exportJson') exportJson()
  if (button.id === 'exportXls') exportXls()
  if (button.id === 'importButton') document.querySelector<HTMLInputElement>('#importFile')!.click()
  if (button.id === 'clearFilters') {
    Object.assign(filters, { search: '', status: '', subject: '', priority: '' })
    render()
  }
  if (button.dataset.edit) {
    const task = tasks.find(item => item.id === button.dataset.edit)
    if (task) openDialog(task)
  }
  if (button.dataset.delete) {
    const task = tasks.find(item => item.id === button.dataset.delete)
    if (task && window.confirm(`¿Eliminar la tarea ${task.title}?`)) {
      if (saveTasks(tasks.filter(item => item.id !== task.id))) {
        render()
        showToast('Tarea eliminada')
      }
    }
  }
})

app.addEventListener('submit', event => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches('#taskForm')) return
  event.preventDefault()
  const form = event.target as HTMLFormElement
  const values = new FormData(form)
  const id = String(values.get('id') || '')
  const previous = tasks.find(item => item.id === id)
  const title = String(values.get('title') || '').trim()
  const subject = String(values.get('subject') || '').trim()
  const dueAt = String(values.get('dueAt') || '')
  const priority = String(values.get('priority')) as Priority
  const status = String(values.get('status')) as Status
  if (!title || !subject || !Number.isFinite(new Date(dueAt).getTime())) {
    showToast('Completa todos los campos obligatorios')
    return
  }
  const now = new Date().toISOString()
  const task: Task = { id: previous?.id || crypto.randomUUID(), title, subject, dueAt, priority, status, createdAt: previous?.createdAt || now, updatedAt: now }
  const next = previous ? tasks.map(item => item.id === id ? task : item) : [...tasks, task]
  if (saveTasks(next)) {
    render()
    showToast(previous ? 'Tarea actualizada' : 'Tarea guardada')
  }
}, true)

app.addEventListener('change', event => {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  if (target.id === 'importFile') {
    const file = (target as HTMLInputElement).files?.[0]
    if (file) void importJson(file)
    target.value = ''
    return
  }
  const keys: Record<string, keyof typeof filters> = { statusFilter: 'status', subjectFilter: 'subject', priorityFilter: 'priority' }
  if (keys[target.id]) {
    filters[keys[target.id]] = target.value
    render()
  }
  if (target.dataset.status) {
    const next = tasks.map(task => task.id === target.dataset.status ? { ...task, status: target.value as Status, updatedAt: new Date().toISOString() } : task)
    if (saveTasks(next)) {
      render()
      showToast('Estado actualizado')
    }
  }
})

app.addEventListener('input', event => {
  const target = event.target as HTMLInputElement
  if (target.id !== 'search') return
  const position = target.selectionStart
  filters.search = target.value
  render()
  const search = document.querySelector<HTMLInputElement>('#search')!
  search.focus()
  search.setSelectionRange(position, position)
})

tasks = readTasks()
render()
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`))
}
