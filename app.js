/**
 * Billiards Timer Pro - AI-Generated Pool Hall Management System
 * Features: Multi-table tracking, real-time billing, dark/light themes,
 * internationalization, data persistence, and smart billing options
 */

class BilliardsApp {
    constructor() {
        this.tables = new Map();
        this.settings = this.loadSettings();
        this.currentLang = this.settings.language || 'vi';
        this.currentTheme = this.settings.theme || 'light';
        this.history = this.loadHistory();
        this.intervalId = null;
        
        // Load existing data first
        this.loadData();
        
        this.initializeApp();
    }

    // ===== INITIALIZATION =====
    initializeApp() {
        this.initializeI18n();
        this.initializeTheme();
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.startGlobalUpdates();
        this.hideLoadingScreen();
        this.updateDisplay();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            const app = document.getElementById('app');
            
            // Fade out loading screen
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'block';
                
                // Trigger entrance animations
                this.triggerEntranceAnimations();
            }, 500);
        }, 1200); // Increased loading time for better UX
    }
    
    triggerEntranceAnimations() {
        // Stagger animations for different sections
        const sections = [
            '.header',
            '.quick-actions',
            '.global-summary',
            '.tables-container'
        ];
        
        sections.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 150);
            }
        });
    }

    initializeEventListeners() {
        // Navigation controls
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('languageToggle').addEventListener('click', () => this.toggleLanguage());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        // Quick actions
        document.getElementById('startAllBtn').addEventListener('click', () => this.startAllTables());
        document.getElementById('pauseAllBtn').addEventListener('click', () => this.pauseAllTables());
        document.getElementById('addTableBtn').addEventListener('click', () => this.openTableModal());

        // Modal controls
        document.getElementById('closeTableModal').addEventListener('click', () => this.closeModal('tableModal'));
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeModal('settingsModal'));
        document.getElementById('closeBillingModal').addEventListener('click', () => this.closeModal('billingModal'));
        
        // Form submissions
        document.getElementById('tableForm').addEventListener('submit', (e) => this.handleTableSubmit(e));
        
        // Settings form changes
        document.getElementById('roundingMinutes').addEventListener('change', (e) => this.updateSetting('roundingMinutes', e.target.value));
        document.getElementById('serviceFee').addEventListener('change', (e) => this.updateSetting('serviceFee', parseFloat(e.target.value)));
        document.getElementById('currency').addEventListener('change', (e) => this.updateSetting('currency', e.target.value));

        // Data management
        document.getElementById('exportHistoryBtn').addEventListener('click', () => this.exportHistory());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // Modal overlay click to close
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.closeModal();
            }
        });

        // FAB button
        document.getElementById('fabBtn').addEventListener('click', () => this.openTableModal());
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.handleSpacebarPress();
                    break;
                case 'n':
                    e.preventDefault();
                    this.openTableModal();
                    break;
                case 't':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
                case 'l':
                    e.preventDefault();
                    this.toggleLanguage();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.openSettings();
                    } else {
                        this.startAllTables();
                    }
                    break;
                case 'p':
                    e.preventDefault();
                    this.pauseAllTables();
                    break;
                case 'escape':
                    this.closeModal();
                    break;
            }
        });
    }

    // ===== TABLE MANAGEMENT =====
    createTable(config) {
        const id = Date.now().toString();
        const table = {
            id,
            name: config.name || `Table ${this.tables.size + 1}`,
            rate: config.rate || 29000,
            notes: config.notes || '',
            status: 'stopped', // stopped, running, paused
            startTime: null,
            pausedTime: 0,
            elapsedTime: 0,
            cost: 0,
            createdAt: new Date().toISOString(),
            sessions: []
        };

        this.tables.set(id, table);
        this.saveData();
        this.renderTables();
        this.updateGlobalSummary();
        return table;
    }

    updateTable(id, updates) {
        const table = this.tables.get(id);
        if (table) {
            Object.assign(table, updates);
            this.saveData();
            this.renderTables();
            this.updateGlobalSummary();
        }
    }

    deleteTable(id) {
        if (this.tables.has(id)) {
            const table = this.tables.get(id);
            if (table.status === 'running') {
                this.stopTable(id);
            }
            this.tables.delete(id);
            this.saveData();
            this.renderTables();
            this.updateGlobalSummary();
        }
    }

    startTable(id) {
        const table = this.tables.get(id);
        if (!table || table.status === 'running') return;

        table.status = 'running';
        table.startTime = performance.now() - table.pausedTime;
        
        this.updateTable(id, table);
    }

    pauseTable(id) {
        const table = this.tables.get(id);
        if (!table || table.status !== 'running') return;

        table.status = 'paused';
        table.pausedTime = performance.now() - table.startTime;
        
        this.updateTable(id, table);
    }

    stopTable(id) {
        const table = this.tables.get(id);
        if (!table) return;

        if (table.status === 'running') {
            table.elapsedTime = performance.now() - table.startTime;
        } else if (table.status === 'paused') {
            table.elapsedTime = table.pausedTime;
        }

        table.status = 'stopped';
        table.cost = this.calculateCost(table.elapsedTime, table.rate);
        
        // Add to history
        if (table.elapsedTime > 0) {
            const session = {
                tableId: id,
                tableName: table.name,
                startTime: new Date(Date.now() - table.elapsedTime).toISOString(),
                endTime: new Date().toISOString(),
                duration: table.elapsedTime,
                rate: table.rate,
                cost: table.cost,
                notes: table.notes
            };
            
            this.history.push(session);
            table.sessions.push(session);
        }

        // Reset table
        table.startTime = null;
        table.pausedTime = 0;
        table.elapsedTime = 0;
        
        this.updateTable(id, table);
        this.saveHistory();
    }

    resetTable(id) {
        const table = this.tables.get(id);
        if (!table) return;

        table.status = 'stopped';
        table.startTime = null;
        table.pausedTime = 0;
        table.elapsedTime = 0;
        table.cost = 0;
        
        this.updateTable(id, table);
    }

    // ===== BULK OPERATIONS =====
    startAllTables() {
        this.tables.forEach((table, id) => {
            if (table.status === 'stopped' || table.status === 'paused') {
                this.startTable(id);
            }
        });
    }

    pauseAllTables() {
        this.tables.forEach((table, id) => {
            if (table.status === 'running') {
                this.pauseTable(id);
            }
        });
    }

    stopAllTables() {
        this.tables.forEach((table, id) => {
            if (table.status === 'running' || table.status === 'paused') {
                this.stopTable(id);
            }
        });
    }

    // ===== CALCULATIONS =====
    calculateCost(milliseconds, hourlyRate) {
        const hours = milliseconds / (1000 * 60 * 60);
        const baseCost = hourlyRate * hours;
        
        // Apply rounding
        const roundingMinutes = parseInt(this.settings.roundingMinutes || 1);
        if (roundingMinutes > 1) {
            const minutes = milliseconds / (1000 * 60);
            const roundedMinutes = Math.ceil(minutes / roundingMinutes) * roundingMinutes;
            const roundedHours = roundedMinutes / 60;
            const roundedCost = hourlyRate * roundedHours;
            
            // Apply service fee
            const serviceFee = this.settings.serviceFee || 0;
            return Math.round(roundedCost * (1 + serviceFee / 100));
        }
        
        // Apply service fee
        const serviceFee = this.settings.serviceFee || 0;
        return Math.round(baseCost * (1 + serviceFee / 100));
    }

    formatCurrency(amount) {
        const currency = this.settings.currency || 'VND';
        
        if (currency === 'VND') {
            return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
        } else if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount / 23000); // Approximate conversion
        }
        
        return amount.toLocaleString() + ' ' + currency;
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ===== RENDERING =====
    renderTables() {
        const grid = document.getElementById('tablesGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.tables.size === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = '';

        this.tables.forEach((table, id) => {
            const card = this.createTableCard(table);
            grid.appendChild(card);
        });
    }

    createTableCard(table) {
        const currentTime = table.status === 'running' 
            ? performance.now() - table.startTime
            : table.status === 'paused' 
                ? table.pausedTime 
                : table.elapsedTime;

        const currentCost = this.calculateCost(currentTime, table.rate);

        const card = document.createElement('div');
        card.className = `table-card ${table.status === 'running' ? 'active' : ''}`;
        card.innerHTML = `
            <div class="table-header">
                <h3 class="table-name">${this.escapeHtml(table.name)}</h3>
                <span class="table-status ${table.status}" data-i18n="${table.status}">${this.t(table.status)}</span>
            </div>
            
            <div class="table-timer">
                <div class="timer-display ${table.status}">${this.formatTime(currentTime)}</div>
                <div class="cost-display">${this.formatCurrency(currentCost)}</div>
                <div class="rate-display">${this.formatCurrency(table.rate)}/h</div>
            </div>
            
            <div class="table-controls">
                <button class="control-btn start" onclick="billiardsApp.startTable('${table.id}')" 
                        ${table.status === 'running' ? 'disabled' : ''}>
                    <span>▶</span>
                    <span data-i18n="start">${this.t('start')}</span>
                </button>
                <button class="control-btn pause" onclick="billiardsApp.pauseTable('${table.id}')"
                        ${table.status !== 'running' ? 'disabled' : ''}>
                    <span>⏸</span>
                    <span data-i18n="pause">${this.t('pause')}</span>
                </button>
                <button class="control-btn stop" onclick="billiardsApp.stopTable('${table.id}')"
                        ${table.status === 'stopped' ? 'disabled' : ''}>
                    <span>⏹</span>
                    <span data-i18n="stop">${this.t('stop')}</span>
                </button>
            </div>
            
            <div class="table-actions">
                <button class="action-btn" onclick="billiardsApp.editTable('${table.id}')">
                    <span>✏️</span>
                    <span data-i18n="edit">${this.t('edit')}</span>
                </button>
                <button class="action-btn" onclick="billiardsApp.generateBill('${table.id}')">
                    <span>🧾</span>
                    <span data-i18n="bill">${this.t('bill')}</span>
                </button>
                <button class="action-btn danger" onclick="billiardsApp.deleteTable('${table.id}')">
                    <span>🗑️</span>
                    <span data-i18n="delete">${this.t('delete')}</span>
                </button>
            </div>
            
            ${table.notes ? `<div class="table-notes">${this.escapeHtml(table.notes)}</div>` : ''}
        `;

        return card;
    }

    updateGlobalSummary() {
        let totalCost = 0;
        let activeTables = 0;
        let totalTime = 0;
        const maxTables = Math.max(this.tables.size, 1);

        this.tables.forEach(table => {
            const currentTime = table.status === 'running' 
                ? performance.now() - table.startTime
                : table.status === 'paused' 
                    ? table.pausedTime 
                    : table.elapsedTime;

            totalCost += this.calculateCost(currentTime, table.rate);
            totalTime += currentTime;
            
            if (table.status === 'running') {
                activeTables++;
            }
        });

        // Update values with smooth number transitions
        this.animateValue('totalCost', this.formatCurrency(totalCost));
        this.animateValue('activeTables', activeTables);
        this.animateValue('totalTime', this.formatTime(totalTime));
        
        // Update progress bars
        this.updateProgressBars(totalCost, activeTables, totalTime, maxTables);
    }

    animateValue(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = element.textContent;
        if (currentValue !== newValue) {
            element.style.transform = 'scale(1.05)';
            element.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
            }, 100);
        }
    }

    updateProgressBars(totalCost, activeTables, totalTime, maxTables) {
        // Animate progress bars based on activity
        const progressBars = document.querySelectorAll('.progress-bar');
        
        if (progressBars[0]) {
            const costProgress = Math.min((totalCost / 100000) * 100, 100); // Max 100k VND for full bar
            progressBars[0].style.width = `${costProgress}%`;
        }
        
        if (progressBars[1]) {
            const tableProgress = (activeTables / maxTables) * 100;
            progressBars[1].style.width = `${tableProgress}%`;
        }
        
        if (progressBars[2]) {
            const timeProgress = Math.min((totalTime / (1000 * 60 * 60 * 4)) * 100, 100); // Max 4 hours for full bar
            progressBars[2].style.width = `${timeProgress}%`;
        }
    }

    // ===== MODALS =====
    openTableModal(tableId = null) {
        const modal = document.getElementById('tableModal');
        const form = document.getElementById('tableForm');
        
        if (tableId) {
            const table = this.tables.get(tableId);
            if (table) {
                document.getElementById('tableName').value = table.name;
                document.getElementById('tableRate').value = table.rate;
                document.getElementById('tableNotes').value = table.notes;
                form.dataset.tableId = tableId;
            }
        } else {
            form.reset();
            document.getElementById('tableRate').value = 29000;
            delete form.dataset.tableId;
        }

        this.openModal('tableModal');
    }

    openSettings() {
        // Populate settings form
        document.getElementById('roundingMinutes').value = this.settings.roundingMinutes || 1;
        document.getElementById('serviceFee').value = this.settings.serviceFee || 0;
        document.getElementById('currency').value = this.settings.currency || 'VND';
        
        this.openModal('settingsModal');
    }

    openModal(modalId) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);
        
        overlay.classList.add('active');
        modal.style.display = 'block';
        
        // Add escape key listener
        this.escapeKeyListener = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this.escapeKeyListener);
        
        // Focus trap for accessibility
        const focusableElements = modal.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        
        // Animate modal entrance
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    closeModal(modalId = null) {
        const overlay = document.getElementById('modalOverlay');
        
        // Animate modal exit
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.classList.remove('active');
            
            if (modalId) {
                document.getElementById(modalId).style.display = 'none';
            } else {
                // Close all modals
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        }, 300);
        
        // Remove escape key listener
        if (this.escapeKeyListener) {
            document.removeEventListener('keydown', this.escapeKeyListener);
            this.escapeKeyListener = null;
        }
        
        // Return focus to previously focused element
        if (this.previouslyFocused) {
            this.previouslyFocused.focus();
            this.previouslyFocused = null;
        }
    }

    // ===== EVENT HANDLERS =====
    handleTableSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const tableId = form.dataset.tableId;
        const config = {
            name: document.getElementById('tableName').value.trim(),
            rate: parseInt(document.getElementById('tableRate').value),
            notes: document.getElementById('tableNotes').value.trim()
        };

        if (tableId) {
            this.updateTable(tableId, config);
        } else {
            this.createTable(config);
        }

        this.closeModal('tableModal');
    }

    handleSpacebarPress() {
        const runningTables = Array.from(this.tables.values()).filter(t => t.status === 'running');
        
        if (runningTables.length > 0) {
            this.pauseAllTables();
        } else {
            this.startAllTables();
        }
    }

    editTable(id) {
        this.openTableModal(id);
    }

    // ===== UPDATES =====
    startGlobalUpdates() {
        this.intervalId = setInterval(() => {
            let hasRunningTables = false;
            
            this.tables.forEach(table => {
                if (table.status === 'running') {
                    hasRunningTables = true;
                }
            });

            if (hasRunningTables) {
                this.renderTables();
                this.updateGlobalSummary();
            }
        }, 1000);
    }

    updateDisplay() {
        this.renderTables();
        this.updateGlobalSummary();
    }

    // ===== THEME & LANGUAGE =====
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        
        this.settings.theme = this.currentTheme;
        this.saveSettings();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'vi' ? 'en' : 'vi';
        document.documentElement.setAttribute('lang', this.currentLang);
        
        const langBtn = document.querySelector('.lang-text');
        langBtn.textContent = this.currentLang === 'vi' ? 'EN' : 'VI';
        
        this.settings.language = this.currentLang;
        this.saveSettings();
        this.updateAllTranslations();
    }

    // ===== INTERNATIONALIZATION =====
    initializeI18n() {
        this.translations = {
            vi: {
                loading: 'Đang tải...',
                appTitle: 'Billiards Timer Pro',
                aiBadge: 'AI-Generated',
                startAll: 'Bắt đầu tất cả',
                pauseAll: 'Tạm dừng tất cả',
                addTable: 'Thêm bàn',
                totalCost: 'Tổng chi phí',
                activeTables: 'Bàn đang chơi',
                totalTime: 'Tổng thời gian',
                noTables: 'Chưa có bàn nào',
                addFirstTable: 'Nhấn "Thêm bàn" để bắt đầu',
                tableSettings: 'Cài đặt bàn',
                tableName: 'Tên bàn',
                hourlyRate: 'Giá theo giờ (₫)',
                notes: 'Ghi chú',
                cancel: 'Hủy',
                save: 'Lưu',
                settings: 'Cài đặt',
                billing: 'Thanh toán',
                roundTo: 'Làm tròn đến',
                serviceFee: 'Phí dịch vụ (%)',
                display: 'Hiển thị',
                currency: 'Tiền tệ',
                data: 'Dữ liệu',
                exportHistory: 'Xuất lịch sử',
                clearHistory: 'Xóa lịch sử',
                generateBill: 'Tạo hóa đơn',
                running: 'Đang chơi',
                paused: 'Tạm dừng',
                stopped: 'Dừng',
                start: 'Bắt đầu',
                pause: 'Tạm dừng',
                stop: 'Dừng',
                edit: 'Sửa',
                bill: 'Hóa đơn',
                delete: 'Xóa'
            },
            en: {
                loading: 'Loading...',
                appTitle: 'Billiards Timer Pro',
                aiBadge: 'AI-Generated',
                startAll: 'Start All',
                pauseAll: 'Pause All',
                addTable: 'Add Table',
                totalCost: 'Total Cost',
                activeTables: 'Active Tables',
                totalTime: 'Total Time',
                noTables: 'No tables yet',
                addFirstTable: 'Click "Add Table" to start',
                tableSettings: 'Table Settings',
                tableName: 'Table Name',
                hourlyRate: 'Hourly Rate',
                notes: 'Notes',
                cancel: 'Cancel',
                save: 'Save',
                settings: 'Settings',
                billing: 'Billing',
                roundTo: 'Round to',
                serviceFee: 'Service Fee (%)',
                display: 'Display',
                currency: 'Currency',
                data: 'Data',
                exportHistory: 'Export History',
                clearHistory: 'Clear History',
                generateBill: 'Generate Bill',
                running: 'Running',
                paused: 'Paused',
                stopped: 'Stopped',
                start: 'Start',
                pause: 'Pause',
                stop: 'Stop',
                edit: 'Edit',
                bill: 'Bill',
                delete: 'Delete'
            }
        };

        document.documentElement.setAttribute('lang', this.currentLang);
        const langBtn = document.querySelector('.lang-text');
        langBtn.textContent = this.currentLang === 'vi' ? 'EN' : 'VI';
    }

    t(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    updateAllTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        this.renderTables();
    }

    // ===== DATA PERSISTENCE =====
    saveData() {
        const data = {
            tables: Array.from(this.tables.entries()),
            timestamp: Date.now()
        };
        localStorage.setItem('billiardsApp_tables', JSON.stringify(data));
    }

    loadData() {
        try {
            const data = JSON.parse(localStorage.getItem('billiardsApp_tables'));
            if (data && data.tables) {
                this.tables = new Map(data.tables);
            }
        } catch (error) {
            console.error('Error loading tables data:', error);
        }
    }

    saveSettings() {
        localStorage.setItem('billiardsApp_settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('billiardsApp_settings'));
            return settings || {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        // Update display if needed
        if (key === 'currency' || key === 'roundingMinutes' || key === 'serviceFee') {
            this.renderTables();
            this.updateGlobalSummary();
        }
    }

    saveHistory() {
        localStorage.setItem('billiardsApp_history', JSON.stringify(this.history));
    }

    loadHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('billiardsApp_history'));
            return history || [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    // ===== UTILITY FUNCTIONS =====
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== EXPORT & BILLING =====
    exportHistory() {
        const data = {
            exported: new Date().toISOString(),
            settings: this.settings,
            history: this.history,
            tables: Array.from(this.tables.entries())
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billiards-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearHistory() {
        if (confirm(this.t('confirmClearHistory') || 'Are you sure you want to clear all history?')) {
            this.history = [];
            this.saveHistory();
        }
    }

    generateBill(tableId) {
        const table = this.tables.get(tableId);
        if (!table) return;

        const currentTime = table.status === 'running' 
            ? performance.now() - table.startTime
            : table.status === 'paused' 
                ? table.pausedTime 
                : table.elapsedTime;

        const cost = this.calculateCost(currentTime, table.rate);
        
        // Implementation for bill generation would go here
        console.log('Generate bill for table:', table.name, 'Cost:', cost);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.billiardsApp = new BilliardsApp();
    });
} else {
    window.billiardsApp = new BilliardsApp();
}