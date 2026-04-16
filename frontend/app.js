// ============ DOM ELEMENTS ============
const taskList = document.getElementById('taskList');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDesc');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskCountSpan = document.getElementById('taskCount');

// API Base URL (change if your backend runs on different port)
const API_URL = 'http://localhost:3000';

// ============ HELPER FUNCTIONS ============

// Format date nicely
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create DOM element for a single task
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) {
        li.classList.add('completed');
    }
    li.dataset.id = task.id;

    li.innerHTML = `
    <div class="task-content">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        📅 ${formatDate(task.created_at)}
        ${task.completed ? ' ✓ Completed' : ' ○ Pending'}
      </div>
    </div>
    <button class="delete-btn" data-id="${task.id}">Delete</button>
  `;

    // Add delete event listener
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return li;
}

// Helper to prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display tasks in the DOM
function renderTasks(tasks) {
    // Clear current list
    taskList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">✨ No tasks yet. Add one above!</li>';
        taskCountSpan.textContent = '0 tasks • Ready to organize?';
        return;
    }

    // Add each task to the list
    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    // Update task count
    const pendingCount = tasks.filter(t => !t.completed).length;
    taskCountSpan.textContent = `${tasks.length} total • ${pendingCount} pending`;
}

// ============ API FUNCTIONS ============

// Fetch and display all tasks
async function fetchTasks() {
    try {
        // Show loading state
        taskList.innerHTML = '<li class="loading">⏳ Loading tasks...</li>';

        console.log('📡 Fetching tasks from:', `${API_URL}/tasks`);

        const response = await fetch(`${API_URL}/tasks`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Tasks received:', result);

        // The API returns { success: true, data: [...] }
        const tasks = result.data || result.tasks || result;
        renderTasks(Array.isArray(tasks) ? tasks : []);

    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        taskList.innerHTML = `<li class="empty-state">⚠️ Cannot connect to server. Make sure backend is running on ${API_URL}</li>`;
    }
}

// Add a new task
async function addTask(title, description) {
    if (!title || title.trim() === '') {
        alert('Please enter a task title');
        return false;
    }

    try {
        console.log('📝 Creating task:', { title, description });

        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title.trim(),
                description: description?.trim() || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create task');
        }

        const result = await response.json();
        console.log('✅ Task created:', result);

        // Refresh the task list
        await fetchTasks();
        return true;

    } catch (error) {
        console.error('❌ Error adding task:', error);
        alert('Failed to add task: ' + error.message);
        return false;
    }
}

// Delete a task
async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;

    try {
        console.log('🗑️ Deleting task:', taskId);

        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        console.log('✅ Task deleted');

        // Remove from DOM immediately for better UX
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }

        // Refresh to ensure consistency
        await fetchTasks();

    } catch (error) {
        console.error('❌ Error deleting task:', error);
        alert('Failed to delete task: ' + error.message);
    }
}

// ============ EVENT HANDLERS ============

// Handle add button click
async function handleAddTask() {
    const title = taskTitleInput.value;
    const description = taskDescInput.value;

    const success = await addTask(title, description);

    if (success) {
        // Clear inputs
        taskTitleInput.value = '';
        taskDescInput.value = '';
        // Refocus on title input
        taskTitleInput.focus();
    }
}

// Handle Enter key in inputs
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        handleAddTask();
    }
}

// ============ INITIALIZE APP ============

function init() {
    console.log('🚀 Task Manager App Initialized');
    console.log('API URL:', API_URL);

    // Set up event listeners
    addTaskBtn.addEventListener('click', handleAddTask);
    taskTitleInput.addEventListener('keypress', handleKeyPress);
    taskDescInput.addEventListener('keypress', handleKeyPress);

    // Load tasks from backend
    fetchTasks();
}

// Start the app when page loads
init();