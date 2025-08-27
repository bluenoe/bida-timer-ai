class BilliardsTimer {
    constructor() {
        // DOM elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.costDisplay = document.getElementById('costDisplay');
        this.hourlyRateInput = document.getElementById('hourlyRate');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusValue = document.getElementById('statusValue');
        this.ratePerMinute = document.getElementById('ratePerMinute');

        // Timer state
        this.isRunning = false;
        this.startTime = null;
        this.elapsedTime = 0; // in milliseconds
        this.intervalId = null;

        // Initialize
        this.init();
    }

    init() {
        // Event listeners
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.hourlyRateInput.addEventListener('input', () => this.updateRatePerMinute());

        // Initialize display
        this.updateDisplay();
        this.updateRatePerMinute();
        this.updateStatus('Ready');
    }

    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now() - this.elapsedTime;
            
            // Update UI
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.timerDisplay.classList.add('running');
            this.updateStatus('Running');
            
            // Start the interval
            this.intervalId = setInterval(() => {
                this.updateTimer();
            }, 100); // Update every 100ms for smooth animation
        }
    }

    stopTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
            
            // Update UI
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.timerDisplay.classList.remove('running');
            this.updateStatus('Stopped');
        }
    }

    resetTimer() {
        // Stop timer if running
        if (this.isRunning) {
            this.stopTimer();
        }

        // Reset values
        this.elapsedTime = 0;
        this.startTime = null;

        // Update display
        this.updateDisplay();
        this.updateStatus('Ready');
        
        // Reset UI classes
        this.timerDisplay.classList.remove('running');
        this.costDisplay.classList.remove('updating');
    }

    updateTimer() {
        if (this.isRunning) {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        // Update timer display
        const timeString = this.formatTime(this.elapsedTime);
        this.timerDisplay.textContent = timeString;

        // Update cost display
        const cost = this.calculateCost();
        const formattedCost = this.formatCurrency(cost);
        
        if (this.costDisplay.textContent !== formattedCost) {
            this.costDisplay.textContent = formattedCost;
            this.costDisplay.classList.add('updating');
            setTimeout(() => {
                this.costDisplay.classList.remove('updating');
            }, 300);
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    calculateCost() {
        const hourlyRate = parseFloat(this.hourlyRateInput.value) || 0;
        const hours = this.elapsedTime / (1000 * 60 * 60); // Convert ms to hours
        return Math.round(hourlyRate * hours);
    }

    formatCurrency(amount) {
        return `${amount.toLocaleString('vi-VN')} VND`;
    }

    updateRatePerMinute() {
        const hourlyRate = parseFloat(this.hourlyRateInput.value) || 0;
        const perMinute = Math.round(hourlyRate / 60);
        this.ratePerMinute.textContent = `${perMinute.toLocaleString('vi-VN')} VND`;
        
        // Update cost if timer is running
        if (this.isRunning || this.elapsedTime > 0) {
            this.updateDisplay();
        }
    }

    updateStatus(status) {
        this.statusValue.textContent = status;
        this.statusValue.className = 'session-value';
        
        if (status === 'Running') {
            this.statusValue.classList.add('running');
        } else if (status === 'Stopped') {
            this.statusValue.classList.add('stopped');
        }
    }

    // Public methods for external access
    getElapsedTime() {
        return this.elapsedTime;
    }

    getCurrentCost() {
        return this.calculateCost();
    }

    getStatus() {
        return this.isRunning ? 'Running' : (this.elapsedTime > 0 ? 'Stopped' : 'Ready');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const timer = new BilliardsTimer();
    
    // Make timer globally accessible for debugging
    window.billiardsTimer = timer;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Spacebar to start/stop
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (timer.isRunning) {
                timer.stopTimer();
            } else {
                timer.startTimer();
            }
        }
        
        // R key to reset
        if (e.key === 'r' || e.key === 'R') {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
                timer.resetTimer();
            }
        }
        
        // Escape key to stop
        if (e.key === 'Escape') {
            if (timer.isRunning) {
                timer.stopTimer();
            }
        }
    });

    // Add visibility change handler to pause timer when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && timer.isRunning) {
            // Store the time when tab becomes hidden
            timer.hiddenTime = Date.now();
        } else if (!document.hidden && timer.hiddenTime && timer.isRunning) {
            // Adjust start time to account for hidden duration
            const hiddenDuration = Date.now() - timer.hiddenTime;
            timer.startTime += hiddenDuration;
            timer.hiddenTime = null;
        }
    });

    // Add beforeunload handler to warn user about ongoing session
    window.addEventListener('beforeunload', (e) => {
        if (timer.isRunning) {
            e.preventDefault();
            e.returnValue = 'You have an active timer session. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    console.log('🎱 Billiards Timer initialized successfully!');
    console.log('Keyboard shortcuts:');
    console.log('  - Spacebar: Start/Stop timer');
    console.log('  - R: Reset timer');
    console.log('  - Escape: Stop timer');
});