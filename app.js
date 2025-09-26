// Girly To-Do List Application JavaScript

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.selectedDate = null;
        this.currentDate = new Date();
        this.calendarDate = new Date();
        this.timer = {
            duration: 25 * 60, // 25 minutes in seconds
            remaining: 25 * 60,
            isRunning: false,
            interval: null,
            type: 'work'
        };
        this.taskIdCounter = 1;
        
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateTime();
        this.renderCalendar();
        this.renderTasks();
        this.updateTimerDisplay();
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
        
        // Start time updates
        setInterval(() => this.updateTime(), 1000);
        
        // Check for reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    }

    loadSampleData() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        this.tasks = [
            {
                id: 1,
                title: "Complete project proposal",
                dueDate: tomorrow.toISOString().split('T')[0],
                reminderTime: "10:00",
                completed: false,
                createdAt: new Date()
            },
            {
                id: 2,
                title: "Buy groceries",
                dueDate: today.toISOString().split('T')[0],
                reminderTime: "15:30",
                completed: false,
                createdAt: new Date()
            },
            {
                id: 3,
                title: "Call mom",
                dueDate: today.toISOString().split('T')[0],
                reminderTime: "18:00",
                completed: true,
                createdAt: new Date()
            }
        ];
        this.taskIdCounter = 4;
    }

    setupEventListeners() {
        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // Timer controls
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());

        // Timer session buttons
        document.querySelectorAll('.session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTimerSession(parseInt(e.target.dataset.duration)));
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
    }

    addTask() {
        const titleInput = document.getElementById('taskInput');
        const dateInput = document.getElementById('taskDate');
        const timeInput = document.getElementById('taskTime');
        
        const title = titleInput.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            title: title,
            dueDate: dateInput.value || new Date().toISOString().split('T')[0],
            reminderTime: timeInput.value || '09:00',
            completed: false,
            createdAt: new Date()
        };

        this.tasks.push(task);
        
        // Clear inputs
        titleInput.value = '';
        dateInput.value = '';
        timeInput.value = '';
        
        this.renderTasks();
        this.renderCalendar();
        this.showNotification('Task added successfully! ✨', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            
            if (task.completed) {
                this.showNotification('Task completed! Great job! 🎉', 'success');
            }
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
        this.renderCalendar();
        this.showNotification('Task deleted', 'success');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        
        switch (this.currentFilter) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filtered = this.tasks.filter(task => task.dueDate === today);
                break;
            case 'pending':
                filtered = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = this.tasks.filter(task => task.completed);
                break;
            case 'all':
            default:
                filtered = this.tasks;
                break;
        }

        if (this.selectedDate) {
            filtered = filtered.filter(task => task.dueDate === this.selectedDate);
        }

        return filtered.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(a.dueDate + ' ' + a.reminderTime) - new Date(b.dueDate + ' ' + b.reminderTime);
        });
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="no-tasks">No tasks found 💕</li>';
            return;
        }
        
        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-meta">
                        📅 ${this.formatDate(task.dueDate)} • ⏰ ${task.reminderTime}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="delete-btn" onclick="app.deleteTask(${task.id})">🗑️</button>
                </div>
            </li>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === tomorrow.toISOString().split('T')[0]) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    changeMonth(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarTitle = document.getElementById('calendarTitle');
        const calendarBody = document.getElementById('calendarBody');
        
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        
        calendarTitle.textContent = this.calendarDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        let calendarHTML = '';
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 41); // 6 weeks
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateString = date.toISOString().split('T')[0];
            const isCurrentMonth = date.getMonth() === month;
            const isToday = dateString === todayString;
            const isSelected = dateString === this.selectedDate;
            const hasTasks = this.tasks.some(task => task.dueDate === dateString);
            
            const classes = [
                'calendar-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                !isCurrentMonth ? 'other-month' : '',
                hasTasks ? 'has-tasks' : ''
            ].filter(Boolean).join(' ');
            
            calendarHTML += `
                <div class="${classes}" onclick="app.selectDate('${dateString}')">
                    ${date.getDate()}
                </div>
            `;
        }
        
        calendarBody.innerHTML = calendarHTML;
    }

    selectDate(dateString) {
        this.selectedDate = this.selectedDate === dateString ? null : dateString;
        this.renderCalendar();
        this.renderTasks();
        
        if (this.selectedDate) {
            const date = new Date(this.selectedDate);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            this.showNotification(`Showing tasks for ${formattedDate}`, 'success');
        }
    }

    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.interval = setInterval(() => {
                this.timer.remaining--;
                this.updateTimerDisplay();
                
                if (this.timer.remaining <= 0) {
                    this.timerComplete();
                }
            }, 1000);
            
            this.updateTimerButtons();
        }
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isRunning = false;
            clearInterval(this.timer.interval);
            this.updateTimerButtons();
        }
    }

    resetTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        this.timer.remaining = this.timer.duration;
        this.updateTimerDisplay();
        this.updateTimerButtons();
    }

    setTimerSession(minutes) {
        this.pauseTimer();
        this.timer.duration = minutes * 60;
        this.timer.remaining = minutes * 60;
        
        // Update session buttons
        document.querySelectorAll('.session-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.duration) === minutes);
        });
        
        // Update timer type
        if (minutes === 25) {
            this.timer.type = 'work';
        } else if (minutes === 5) {
            this.timer.type = 'short break';
        } else {
            this.timer.type = 'long break';
        }
        
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.remaining / 60);
        const seconds = this.timer.remaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerTime').textContent = timeString;
        document.getElementById('timerLabel').textContent = this.timer.type.charAt(0).toUpperCase() + this.timer.type.slice(1);
        
        // Update progress circle
        const percentage = ((this.timer.duration - this.timer.remaining) / this.timer.duration) * 360;
        const circle = document.querySelector('.timer-circle');
        if (circle) {
            circle.style.setProperty('--progress', `${percentage}deg`);
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        
        if (this.timer.isRunning) {
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        } else {
            startBtn.textContent = 'Start';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }

    timerComplete() {
        this.pauseTimer();
        this.showNotification(`${this.timer.type} session complete! 🎉`, 'success');
        this.playNotificationSound();
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete! 🎉', {
                body: `Your ${this.timer.type} session is finished.`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>'
            });
        }
    }

    checkReminders() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = now.toISOString().split('T')[0];
        
        this.tasks.forEach(task => {
            if (!task.completed && task.dueDate === currentDate && task.reminderTime === currentTime && !task.notified) {
                this.showNotification(`Reminder: ${task.title} 🔔`, 'warning');
                this.playNotificationSound();
                task.notified = true;
                
                // Show browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Task Reminder! 🔔', {
                        body: task.title,
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>'
                    });
                }
            }
        });
    }

    showNotification(message, type = 'success') {
        const notificationsArea = document.getElementById('notificationsArea');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${type === 'success' ? '✨ Success' : type === 'warning' ? '⚠️ Reminder' : '📢 Info'}</div>
            <div class="notification-message">${message}</div>
        `;
        
        notificationsArea.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    playNotificationSound() {
        const audio = document.getElementById('notificationSound');
        if (audio) {
            audio.play().catch(e => {
                // Handle audio play failure silently
                console.log('Audio play failed:', e);
            });
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Add some additional helper functions
document.addEventListener('click', (e) => {
    // Close notifications when clicking outside
    if (!e.target.closest('.notification') && !e.target.closest('.btn')) {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        });
    }
});

// Handle page visibility for timer
document.addEventListener('visibilitychange', () => {
    if (window.app && document.hidden && window.app.timer.isRunning) {
        // Optionally pause timer when page is hidden
        // window.app.pauseTimer();
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                if (document.activeElement.id === 'taskInput') {
                    e.preventDefault();
                    window.app.addTask();
                }
                break;
            case ' ':
                if (window.app && !document.activeElement.matches('input, textarea')) {
                    e.preventDefault();
                    if (window.app.timer.isRunning) {
                        window.app.pauseTimer();
                    } else {
                        window.app.startTimer();
                    }
                }
                break;
        }
    }
});