class PrinterMonitor {
    constructor() {
        this.printers = [
            { name: 'Oneill3rdfloorprinter01.bc.edu', ip: '136.167.67.130' },
            { name: 'Oneill3rdfloorprinter02.bc.edu', ip: '136.167.66.108' },
            { name: 'Oneill3rdfloorprinter03.bc.edu', ip: '136.167.67.32' },
            { name: 'Oneill3rdfloorprinter04.bc.edu', ip: '136.167.69.110' },
            { name: 'Oneill3rdfloorprinter05.bc.edu', ip: '136.167.69.140' },
            { name: 'oneill3rdfloorprinter06.bc.edu', ip: '136.167.66.240' },
            { name: 'oneill3rdfloorcolorprinter01.bc.edu', ip: '136.167.67.81' },
            { name: '2150comm.bc.edu', ip: '136.167.214.175' },
            { name: 'WIHD', ip: '136.167.66.220' }
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPrinters();
        this.checkAllPrinters();
        
        // Auto-refresh every 2 minutes
        setInterval(() => this.checkAllPrinters(), 120000);
    }

    bindEvents() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.checkAllPrinters();
        });
    }

    loadPrinters() {
        const container = document.getElementById('printersContainer');
        container.innerHTML = '';
        
        this.printers.forEach(printer => {
            const card = this.createPrinterCard(printer);
            container.appendChild(card);
        });
    }

    createPrinterCard(printer) {
        const card = document.createElement('div');
        card.className = 'printer-card unknown';
        card.id = `printer-${printer.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        card.innerHTML = `
            <div class="printer-header">
                <div class="printer-name">${printer.name}</div>
                <div class="status-indicator unknown"></div>
            </div>
            <div class="printer-details">
                <div class="printer-ip">IP: ${printer.ip}</div>
                <div class="printer-status status-unknown">Checking...</div>
            </div>
        `;
        
        return card;
    }

    async checkAllPrinters() {
        const refreshBtn = document.getElementById('refreshBtn');
        const loading = document.getElementById('loading');
        const lastUpdated = document.getElementById('lastUpdated');
        
        refreshBtn.disabled = true;
        loading.style.display = 'block';
        
        try {
            const response = await fetch('/.netlify/functions/check-printers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printers: this.printers })
            });
            
            const results = await response.json();
            
            this.updatePrinterStatus(results);
            
            lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            
        } catch (error) {
            console.error('Error checking printers:', error);
            this.showError('Failed to check printer status');
        } finally {
            refreshBtn.disabled = false;
            loading.style.display = 'none';
        }
    }

    updatePrinterStatus(results) {
        results.forEach(result => {
            const card = document.getElementById(`printer-${result.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
            if (!card) return;
            
            const statusIndicator = card.querySelector('.status-indicator');
            const statusText = card.querySelector('.printer-status');
            
            card.className = `printer-card ${result.status}`;
            statusIndicator.className = `status-indicator ${result.status}`;
            
            if (result.status === 'online') {
                statusText.className = 'printer-status status-online';
                statusText.textContent = 'Online';
            } else if (result.status === 'offline') {
                statusText.className = 'printer-status status-offline';
                statusText.textContent = 'Offline';
            } else {
                statusText.className = 'printer-status status-unknown';
                statusText.textContent = 'Unknown';
            }
            
            if (result.responseTime) {
                statusText.textContent += ` (${result.responseTime}ms)`;
            }
        });
    }

    showError(message) {
        const container = document.getElementById('printersContainer');
        container.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; color: white; background: #f44336; padding: 20px; border-radius: 10px;">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the printer monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PrinterMonitor();
});
