// ============================================
// Aplikacja ToDo - Główna logika aplikacji
// ============================================

// Model danych - klasa reprezentująca zadanie
class Task {
    constructor(title, description = '', assignee = '', priority = 'medium', deadline = '', category = '') {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.title = title;
        this.description = description;
        this.assignee = assignee;
        this.priority = priority; // 'low', 'medium', 'high'
        this.deadline = deadline;
        this.category = category;
        this.completed = false;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

// Główny obiekt aplikacji
const TodoApp = {
    tasks: [],
    currentFilter: 'all',
    currentSort: 'date-desc',
    editingTaskId: null,
    taskToDelete: null,

    // Inicjalizacja aplikacji
    init() {
        this.loadTasks();
        this.initMaterialize();
        this.bindEvents();
        this.renderTasks();
        this.updateActiveTasksCount();
    },

    // Inicjalizacja komponentów Materialize
    initMaterialize() {
        // Date picker
        const datePicker = document.querySelectorAll('.datepicker');
        M.Datepicker.init(datePicker, {
            format: 'yyyy-mm-dd',
            i18n: {
                months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
                monthsShort: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
                weekdays: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
                weekdaysShort: ['Nie', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'],
                today: 'Dzisiaj',
                clear: 'Wyczyść',
                cancel: 'Anuluj',
                done: 'OK'
            }
        });

        // Select dropdown
        const selects = document.querySelectorAll('select');
        M.FormSelect.init(selects);

        // Modal
        const modals = document.querySelectorAll('.modal');
        M.Modal.init(modals);
    },

    // Powiązanie zdarzeń
    bindEvents() {
        // Formularz dodawania/edycji zadania
        const taskForm = document.getElementById('taskForm');
        taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Przycisk anulowania edycji
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.cancelEdit());

        // Filtry
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                this.setFilter(chip.dataset.filter);
            });
        });

        // Sortowanie
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });

        // Wyszukiwarka
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderTasks();
        });

        // Eksport
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToJSON());

        // Import
        document.getElementById('importFile').addEventListener('change', (e) => this.importFromJSON(e));
    },

    // Obsługa submit formularza
    handleFormSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('taskTitle').value.trim();
        if (!title) {
            M.toast({html: 'Tytuł zadania jest wymagany!', classes: 'red'});
            return;
        }

        if (this.editingTaskId) {
            // Edycja istniejącego zadania
            this.updateTask(this.editingTaskId, {
                title: title,
                description: document.getElementById('taskDescription').value.trim(),
                assignee: document.getElementById('taskAssignee').value.trim(),
                priority: document.getElementById('taskPriority').value,
                deadline: document.getElementById('taskDeadline').value,
                category: document.getElementById('taskCategory').value.trim(),
                updatedAt: new Date().toISOString()
            });
            M.toast({html: 'Zadanie zostało zaktualizowane!', classes: 'green'});
        } else {
            // Dodawanie nowego zadania
            const task = new Task(
                title,
                document.getElementById('taskDescription').value.trim(),
                document.getElementById('taskAssignee').value.trim(),
                document.getElementById('taskPriority').value,
                document.getElementById('taskDeadline').value,
                document.getElementById('taskCategory').value.trim()
            );
            this.addTask(task);
            M.toast({html: 'Zadanie zostało dodane!', classes: 'green'});
        }

        this.resetForm();
        this.saveTasks();
        this.renderTasks();
        this.updateActiveTasksCount();
    },

    // Dodawanie zadania
    addTask(task) {
        this.tasks.push(task);
    },

    // Aktualizacja zadania
    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
        }
    },

    // Usuwanie zadania
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateActiveTasksCount();
        M.toast({html: 'Zadanie zostało usunięte!', classes: 'orange'});
    },

    // Przełączanie statusu ukończenia
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateActiveTasksCount();
        }
    },

    // Rozpoczęcie edycji zadania
    startEdit(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskAssignee').value = task.assignee;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDeadline').value = task.deadline;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('cancelEditBtn').style.display = 'inline-block';
            document.querySelector('#taskForm button[type="submit"]').innerHTML = '<i class="material-icons left">save</i>Zapisz zmiany';
            
            // Aktualizacja select i datepicker
            M.FormSelect.init(document.querySelectorAll('select'));
            const datePicker = M.Datepicker.getInstance(document.getElementById('taskDeadline'));
            if (datePicker && task.deadline) {
                datePicker.setDate(new Date(task.deadline));
            }

            // Przewiń do formularza
            document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Anulowanie edycji
    cancelEdit() {
        this.editingTaskId = null;
        this.resetForm();
    },

    // Reset formularza
    resetForm() {
        document.getElementById('taskForm').reset();
        this.editingTaskId = null;
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.querySelector('#taskForm button[type="submit"]').innerHTML = '<i class="material-icons left">add</i>Dodaj zadanie';
        
        // Reset datepicker
        const datePicker = M.Datepicker.getInstance(document.getElementById('taskDeadline'));
        if (datePicker) {
            datePicker.setDate(null);
        }
        
        // Reset select
        M.FormSelect.init(document.querySelectorAll('select'));
    },

    // Ustawienie filtra
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Aktualizacja aktywnych chipów
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.filter === filter) {
                chip.classList.add('active');
            }
        });

        this.renderTasks();
    },

    // Filtrowanie zadań
    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Filtrowanie według statusu
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // Wyszukiwarka
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm) ||
                task.assignee.toLowerCase().includes(searchTerm) ||
                task.category.toLowerCase().includes(searchTerm)
            );
        }

        // Sortowanie
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'priority':
                    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'assignee':
                    return (a.assignee || '').localeCompare(b.assignee || '');
                case 'deadline':
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                default:
                    return 0;
            }
        });

        return filtered;
    },

    // Renderowanie listy zadań
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            const filterText = this.currentFilter === 'all' ? '' : 
                             this.currentFilter === 'active' ? ' aktywnych' : ' zakończonych';
            const searchText = document.getElementById('searchInput').value.trim() ? ' pasujących do wyszukiwania' : '';
            tasksList.innerHTML = `<p class="center-align grey-text">Brak${filterText}${searchText} zadań.</p>`;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
        
        // Powiązanie zdarzeń dla nowo utworzonych elementów
        this.bindTaskEvents();
    },

    // Renderowanie pojedynczego zadania
    renderTask(task) {
        const isOverdue = task.deadline && !task.completed && new Date(task.deadline) < new Date();
        const completedClass = task.completed ? 'completed-task' : '';
        const overdueClass = isOverdue ? 'overdue-task' : '';
        const priorityClass = `priority-${task.priority}`;
        
        const deadlineDate = task.deadline ? new Date(task.deadline).toLocaleDateString('pl-PL') : '';
        const createdDate = new Date(task.createdAt).toLocaleDateString('pl-PL');
        
        return `
            <div class="task-item card ${completedClass} ${overdueClass}" data-task-id="${task.id}">
                <div class="card-content">
                    <div class="row valign-wrapper">
                        <div class="col s1">
                            <label>
                                <input type="checkbox" class="filled-in task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                                <span></span>
                            </label>
                        </div>
                        <div class="col s11">
                            <div class="row">
                                <div class="col s12 m8">
                                    <h5 class="task-title ${task.completed ? 'strikethrough' : ''}">
                                        ${this.escapeHtml(task.title)}
                                        <span class="priority-badge ${priorityClass}">${this.getPriorityLabel(task.priority)}</span>
                                    </h5>
                                    ${task.description ? `<p class="task-description ${task.completed ? 'strikethrough' : ''}">${this.escapeHtml(task.description)}</p>` : ''}
                                </div>
                                <div class="col s12 m4">
                                    <div class="task-meta">
                                        ${task.assignee ? `<p><i class="material-icons tiny">person</i> <strong>Wykonawca:</strong> ${this.escapeHtml(task.assignee)}</p>` : ''}
                                        ${task.category ? `<p><i class="material-icons tiny">label</i> <strong>Kategoria:</strong> ${this.escapeHtml(task.category)}</p>` : ''}
                                        ${deadlineDate ? `<p class="${isOverdue ? 'red-text' : ''}"><i class="material-icons tiny">event</i> <strong>Deadline:</strong> ${deadlineDate}</p>` : ''}
                                        <p class="grey-text text-darken-1"><i class="material-icons tiny">schedule</i> Utworzono: ${createdDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12 right-align">
                            <button class="btn-small waves-effect waves-light cyan edit-btn" data-task-id="${task.id}">
                                <i class="material-icons left">edit</i>Edytuj
                            </button>
                            <button class="btn-small waves-effect waves-light yellow darken-2 delete-btn" data-task-id="${task.id}">
                                <i class="material-icons left">delete</i>Usuń
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Powiązanie zdarzeń dla zadań
    bindTaskEvents() {
        // Checkboxy
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTask(e.target.dataset.taskId);
            });
        });

        // Przyciski edycji
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startEdit(e.target.closest('.edit-btn').dataset.taskId);
            });
        });

        // Przyciski usuwania
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.delete-btn').dataset.taskId;
                this.taskToDelete = taskId;
                const modal = M.Modal.getInstance(document.getElementById('deleteModal'));
                modal.open();
            });
        });

        // Potwierdzenie usunięcia
        document.getElementById('confirmDeleteBtn').onclick = () => {
            if (this.taskToDelete) {
                this.deleteTask(this.taskToDelete);
                this.taskToDelete = null;
                const modal = M.Modal.getInstance(document.getElementById('deleteModal'));
                modal.close();
            }
        };
    },

    // Aktualizacja licznika aktywnych zadań
    updateActiveTasksCount() {
        const activeCountElement = document.getElementById('activeTasksCount');
        if (activeCountElement) {
            const activeCount = this.tasks.filter(t => !t.completed).length;
            activeCountElement.textContent = `${activeCount} aktywnych`;
        }
    },

    // Pobranie etykiety priorytetu
    getPriorityLabel(priority) {
        const labels = {
            'low': 'Niski',
            'medium': 'Średni',
            'high': 'Wysoki'
        };
        return labels[priority] || priority;
    },

    // Escape HTML (zabezpieczenie przed XSS)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Zapisywanie zadań do localStorage
    saveTasks() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Błąd zapisu do localStorage:', e);
            M.toast({html: 'Błąd zapisu danych!', classes: 'red'});
        }
    },

    // Ładowanie zadań z localStorage
    loadTasks() {
        try {
            const saved = localStorage.getItem('todoTasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
            } else {
                this.tasks = [];
            }
        } catch (e) {
            console.error('Błąd odczytu z localStorage:', e);
            this.tasks = [];
            M.toast({html: 'Błąd odczytu danych!', classes: 'red'});
        }
    },

    // Eksport do JSON
    exportToJSON() {
        try {
            const dataStr = JSON.stringify(this.tasks, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            M.toast({html: 'Dane zostały wyeksportowane!', classes: 'green'});
        } catch (e) {
            console.error('Błąd eksportu:', e);
            M.toast({html: 'Błąd eksportu danych!', classes: 'red'});
        }
    },

    // Import z JSON
    importFromJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    // Walidacja danych
                    const validTasks = imported.filter(task => 
                        task.id && task.title && 
                        typeof task.completed === 'boolean'
                    );
                    
                    if (validTasks.length > 0) {
                        // Zapytaj użytkownika czy nadpisać czy dodać
                        if (confirm(`Znaleziono ${validTasks.length} zadań. Czy chcesz nadpisać istniejące zadania? (OK = nadpisz, Anuluj = dodaj)`)) {
                            this.tasks = validTasks;
                        } else {
                            this.tasks = [...this.tasks, ...validTasks];
                        }
                        this.saveTasks();
                        this.renderTasks();
                        this.updateActiveTasksCount();
                        M.toast({html: `Zaimportowano ${validTasks.length} zadań!`, classes: 'green'});
                    } else {
                        M.toast({html: 'Nieprawidłowy format pliku!', classes: 'red'});
                    }
                } else {
                    M.toast({html: 'Nieprawidłowy format pliku!', classes: 'red'});
                }
            } catch (e) {
                console.error('Błąd importu:', e);
                M.toast({html: 'Błąd importu danych!', classes: 'red'});
            }
        };
        reader.readAsText(file);
        
        // Reset input file
        event.target.value = '';
    }
};

// Inicjalizacja aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    TodoApp.init();
});

