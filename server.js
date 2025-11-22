const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Limity walidacji
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

// Middleware do parsowania JSON
app.use(express.json());

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ============================================
// Funkcje pomocnicze do obsługi pliku JSON
// ============================================

/**
 * Odczytuje zadania z pliku JSON
 */
async function readTasks() {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jeśli plik nie istnieje, zwróć pustą tablicę
        if (error.code === 'ENOENT') {
            return [];
        }
        // Błąd parsowania JSON
        if (error instanceof SyntaxError) {
            throw new Error('Plik tasks.json zawiera nieprawidłowy format JSON');
        }
        throw error;
    }
}

/**
 * Zapisuje zadania do pliku JSON
 */
async function writeTasks(tasks) {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// ============================================
// Endpointy REST API
// ============================================

/**
 * GET /health
 * Sprawdza status API
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /tasks
 * Pobiera listę wszystkich zadań
 */
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        // Sortowanie zadań według ID
        tasks.sort((a, b) => a.id - b.id);
        res.json(tasks);
    } catch (error) {
        console.error('Error reading tasks:', error);
        res.status(500).json({
            error: error.message || 'Błąd podczas odczytu zadań'
        });
    }
});

/**
 * POST /tasks
 * Dodaje nowe zadanie
 */
app.post('/tasks', async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Walidacja - tytuł jest wymagany
        if (!title || title.trim() === '') {
            return res.status(400).json({
                error: 'Tytuł zadania jest wymagany'
            });
        }
        
        // Walidacja długości
        if (title.length > MAX_TITLE_LENGTH) {
            return res.status(400).json({
                error: `Tytuł może mieć maksymalnie ${MAX_TITLE_LENGTH} znaków`
            });
        }
        
        if (description && description.length > MAX_DESCRIPTION_LENGTH) {
            return res.status(400).json({
                error: `Opis może mieć maksymalnie ${MAX_DESCRIPTION_LENGTH} znaków`
            });
        }
        
        // Odczyt istniejących zadań
        const tasks = await readTasks();
        
        // Generowanie ID - znajdź pierwszy wolny numer
        let newId = 1;
        const existingIds = tasks.map(t => t.id).sort((a, b) => a - b);
        
        for (const id of existingIds) {
            if (id === newId) {
                newId++;
            } else {
                break;
            }
        }
        
        // Utworzenie nowego zadania
        const newTask = {
            id: newId,
            title: title.trim(),
            description: description || '',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Dodanie nowego zadania
        tasks.push(newTask);
        
        // Zapis do pliku
        await writeTasks(tasks);
        
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            error: error.message || 'Błąd podczas tworzenia zadania'
        });
    }
});

/**
 * PUT /tasks/:id
 * Modyfikuje istniejące zadanie
 */
app.put('/tasks/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        
        // Walidacja ID
        if (isNaN(taskId)) {
            return res.status(400).json({
                error: 'ID musi być liczbą'
            });
        }
        
        const updates = req.body;
        
        // Odczyt istniejących zadań
        const tasks = await readTasks();
        
        // Znalezienie indeksu zadania
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({
                error: 'Task not found',
                id: taskId
            });
        }
        
        // Walidacja danych wejściowych
        if (updates.completed !== undefined && typeof updates.completed !== 'boolean') {
            return res.status(400).json({
                error: 'Pole completed musi być typu boolean'
            });
        }
        
        if (updates.title !== undefined) {
            if (updates.title.trim() === '') {
                return res.status(400).json({
                    error: 'Tytuł zadania nie może być pusty'
                });
            }
            if (updates.title.length > MAX_TITLE_LENGTH) {
                return res.status(400).json({
                    error: `Tytuł może mieć maksymalnie ${MAX_TITLE_LENGTH} znaków`
                });
            }
        }
        
        if (updates.description !== undefined && updates.description.length > MAX_DESCRIPTION_LENGTH) {
            return res.status(400).json({
                error: `Opis może mieć maksymalnie ${MAX_DESCRIPTION_LENGTH} znaków`
            });
        }
        
        // Aktualizacja zadania
        const updatedTask = {
            ...tasks[taskIndex],
            ...updates,
            id: taskId, // ID nie może być zmienione
            createdAt: tasks[taskIndex].createdAt, // createdAt nie może być zmieniony
            updatedAt: new Date().toISOString()
        };
        
        tasks[taskIndex] = updatedTask;
        
        // Zapis do pliku
        await writeTasks(tasks);
        
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: error.message || 'Błąd podczas aktualizacji zadania'
        });
    }
});

/**
 * DELETE /tasks/:id
 * Usuwa zadanie
 */
app.delete('/tasks/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        
        // Walidacja ID
        if (isNaN(taskId)) {
            return res.status(400).json({
                error: 'ID musi być liczbą'
            });
        }
        
        // Odczyt istniejących zadań
        const tasks = await readTasks();
        
        // Znalezienie indeksu zadania
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({
                error: 'Task not found',
                id: taskId
            });
        }
        
        // Usunięcie zadania
        const deletedTask = tasks.splice(taskIndex, 1)[0];
        
        // Zapis do pliku
        await writeTasks(tasks);
        
        res.json(deletedTask);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            error: error.message || 'Błąd podczas usuwania zadania'
        });
    }
});

// ============================================
// Start serwera
// ============================================

app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`  TODO API Server is running`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Time: ${new Date().toLocaleString('pl-PL')}`);
    console.log(`===========================================`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET    /health        - Check API status`);
    console.log(`  GET    /tasks         - Get all tasks`);
    console.log(`  POST   /tasks         - Create new task`);
    console.log(`  PUT    /tasks/:id     - Update task`);
    console.log(`  DELETE /tasks/:id     - Delete task`);
    console.log(`===========================================\n`);
});

// ============================================
// Error handling middleware (musi być na końcu)
// ============================================

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Nieprawidłowy format JSON w request body'
        });
    }
    console.error('Unexpected error:', err);
    res.status(500).json({
        error: 'Wewnętrzny błąd serwera'
    });
});
