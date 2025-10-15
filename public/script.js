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
        
        // Auto-refresh every 5 minutes
        setInterval(() => this.checkAllPrinters(), 300000);
    }

    bindEvents() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.checkAllPrinters();
        });
        
        document.getElementById('refreshDetailsBtn').addEventListener('click', () => {
            this.checkPrinterDetails();
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
                <div class="details-section">
                    <h4>Toner Levels</h4>
                    <div class="toner-info" id="toner-${printer.name.replace(/[^a-zA-Z0-9]/g, '-')}">
                        <div class="toner-item">
                            <span>Black: Loading...</span>
                        </div>
                    </div>
                    
                    <h4>Paper Trays</h4>
                    <div class="tray-info" id="tray-${printer.name.replace(/[^a-zA-Z0-9]/g, '-')}">
                        <div class="tray-item">
                            <span>Tray 1: Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    async checkAllPrinters() {
        const refreshBtn = document.getElementById('refreshBtn');
        const detailsBtn = document.getElementById('refreshDetailsBtn');
        const loading = document.getElementById('loading');
        const lastUpdated = document.getElementById('lastUpdated');
        
        refreshBtn.disabled = true;
        detailsBtn.disabled = true;
        loading.style.display = 'block';
        
        try {
            const response = await fetch('/api/check-printers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printers: this.printers })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const results = await response.json();
            this.updatePrinterStatus(results);
            
            // Also get detailed information
            await this.checkPrinterDetails();
            
            lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            
        } catch (error) {
            console.error('Error checking printers:', error);
            this.showError('Connection issue. Showing demo data.');
            this.showDemoData();
        } finally {
            refreshBtn.disabled = false;
            detailsBtn.disabled = false;
            loading.style.display = 'none';
        }
    }

    async checkPrinterDetails() {
        const detailsBtn = document.getElementById('refreshDetailsBtn');
        const originalText = detailsBtn.textContent;
        
        detailsBtn.disabled = true;
        detailsBtn.textContent = 'Refreshing...';
        
        try {
            const response = await fetch('/api/check-printer-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printers: this.printers })
            });
            
            if (response.ok) {
                const details = await response.json();
                this.updatePrinterDetails(details);
            }
        } catch (error) {
            console.error('Error getting printer details:', error);
            this.showDemoDetails();
        } finally {
            detailsBtn.disabled = false;
            detailsBtn.textContent = originalText;
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

    updatePrinterDetails(details) {
        details.forEach(printerDetail => {
            const tonerElement = document.getElementById(`toner-${printerDetail.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
            const trayElement = document.getElementById(`tray-${printerDetail.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
            
            if (tonerElement && printerDetail.toners) {
                tonerElement.innerHTML = '';
                printerDetail.toners.forEach(toner => {
                    const levelClass = toner.level > 50 ? 'high' : toner.level > 20 ? 'medium' : 'low';
                    tonerElement.innerHTML += `
                        <div class="toner-item">
                            <span>
                                <span class="toner-color toner-${toner.color.toLowerCase()}"></span>
                                ${toner.color}:
                            </span>
                            <div class="toner-level">
                                <div class="toner-bar">
                                    <div class="toner-fill ${levelClass}" style="width: ${toner.level}%"></div>
                                </div>
                            </div>
                            <span class="toner-percentage">${toner.level}%</span>
                        </div>
                    `;
                });
            }
            
            if (trayElement && printerDetail.trays) {
                trayElement.innerHTML = '';
                printerDetail.trays.forEach(tray => {
                    const statusClass = tray.status === 'OK' ? 'tray-ok' : 
                                      tray.status === 'LOW' ? 'tray-low' : 
                                      tray.status === 'EMPTY' ? 'tray-empty' : 'tray-open';
                    trayElement.innerHTML += `
                        <div class="tray-item">
                            <span>${tray.name}:</span>
                            <span class="tray-status ${statusClass}">${tray.status}</span>
                        </div>
                    `;
                });
            }
        });
    }

    showDemoData() {
        const demoResults = this.printers.map(printer => ({
            name: printer.name,
            ip: printer.ip,
            status: Math.random() > 0.3 ? 'online' : 'offline',
            responseTime: Math.floor(Math.random() * 100) + 50
        }));
        this.updatePrinterStatus(demoResults);
        this.showDemoDetails();
        
        const lastUpdated = document.getElementById('lastUpdated');
        lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()} (Demo Mode)`;
    }

    showDemoDetails() {
        const demoDetails = this.printers.map(printer => {
            const isColorPrinter = printer.name.toLowerCase().includes('color');
            
            return {
                name: printer.name,
                toners: isColorPrinter ? [
                    { color: 'Black', level: Math.floor(Math.random() * 100) },
                    { color: 'Cyan', level: Math.floor(Math.random() * 100) },
                    { color: 'Magenta', level: Math.floor(Math.random() * 100) },
                    { color: 'Yellow', level: Math.floor(Math.random() * 100) }
                ] : [
                    { color: 'Black', level: Math.floor(Math.random() * 100) }
                ],
                trays: [
                    { name: 'Tray 1', status: ['OK', 'LOW', 'OK', 'OK'][Math.floor(Math.random() * 4)] },
                    { name: 'Tray 2', status: ['OK', 'EMPTY', 'OK', 'LOW'][Math.floor(Math.random() * 4)] },
                    { name: 'Manual', status: 'OK' }
                ]
            };
        });
        
        this.updatePrinterDetails(demoDetails);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 15px; border-radius: 5px; z-index: 1000;';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// Initialize the printer monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PrinterMonitor();
});
