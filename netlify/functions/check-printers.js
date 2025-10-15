const net = require('net');

exports.handler = async function(event, context) {
    console.log('Printer details function called');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { printers } = JSON.parse(event.body);
        
        if (!printers || !Array.isArray(printers)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid request format' })
            };
        }

        // Get detailed information for all printers
        const details = await Promise.all(
            printers.map(async (printer) => {
                try {
                    // In a real implementation, you would:
                    // 1. Use SNMP to query printer details
                    // 2. Access the printer's web interface
                    // 3. Use manufacturer-specific APIs
                    
                    // For demo purposes, we'll simulate this
                    const printerDetails = await simulatePrinterDetails(printer);
                    return printerDetails;
                    
                } catch (error) {
                    console.error(`Error getting details for ${printer.name}:`, error);
                    return getFallbackDetails(printer);
                }
            })
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(details)
        };

    } catch (error) {
        console.error('Error in check-printer-details function:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

// Simulate getting detailed printer information
async function simulatePrinterDetails(printer) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const isColorPrinter = printer.name.toLowerCase().includes('color');
    const isOnline = Math.random() > 0.2; // 80% chance of being online
    
    if (!isOnline) {
        return getFallbackDetails(printer);
    }
    
    return {
        name: printer.name,
        ip: printer.ip,
        model: simulatePrinterModel(printer.name),
        status: 'online',
        toners: simulateTonerLevels(isColorPrinter),
        trays: simulateTrayStatus(),
        maintenance: simulateMaintenanceInfo(),
        timestamp: new Date().toISOString()
    };
}

function simulateTonerLevels(isColorPrinter) {
    if (isColorPrinter) {
        return [
            { color: 'Black', level: Math.floor(Math.random() * 100) },
            { color: 'Cyan', level: Math.floor(Math.random() * 100) },
            { color: 'Magenta', level: Math.floor(Math.random() * 100) },
            { color: 'Yellow', level: Math.floor(Math.random() * 100) }
        ];
    } else {
        return [
            { color: 'Black', level: Math.floor(Math.random() * 100) }
        ];
    }
}

function simulateTrayStatus() {
    const statuses = ['OK', 'LOW', 'EMPTY', 'OPEN'];
    const trays = [
        { name: 'Tray 1', status: statuses[Math.floor(Math.random() * 3)] }, // No OPEN for main tray
        { name: 'Tray 2', status: statuses[Math.floor(Math.random() * 4)] },
        { name: 'Manual', status: 'OK' }
    ];
    return trays;
}

function simulateMaintenanceInfo() {
    return {
        drumLife: Math.floor(Math.random() * 100),
        pageCount: Math.floor(Math.random() * 50000),
        status: ['OK', 'NEEDS_MAINTENANCE', 'OK'][Math.floor(Math.random() * 3)]
    };
}

function simulatePrinterModel(printerName) {
    const models = [
        'HP LaserJet Pro M404dn',
        'Canon imageCLASS MF743Cdw',
        'Xerox VersaLink C405',
        'Brother HL-L8360CDW',
        'Kyocera Ecosys M6526cdn'
    ];
    return models[Math.floor(Math.random() * models.length)];
}

function getFallbackDetails(printer) {
    const isColorPrinter = printer.name.toLowerCase().includes('color');
    return {
        name: printer.name,
        ip: printer.ip,
        status: 'offline',
        toners: isColorPrinter ? [
            { color: 'Black', level: 0 },
            { color: 'Cyan', level: 0 },
            { color: 'Magenta', level: 0 },
            { color: 'Yellow', level: 0 }
        ] : [
            { color: 'Black', level: 0 }
        ],
        trays: [
            { name: 'Tray 1', status: 'UNKNOWN' },
            { name: 'Tray 2', status: 'UNKNOWN' },
            { name: 'Manual', status: 'UNKNOWN' }
        ],
        error: 'Printer offline or not responding',
        timestamp: new Date().toISOString()
    };
}
