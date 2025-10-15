const dns = require('dns').promises;

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
        const body = JSON.parse(event.body);
        const { printers } = body;
        
        if (!printers || !Array.isArray(printers)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid request format' })
            };
        }

        console.log(`Getting details for ${printers.length} printers`);

        // Get detailed information for all printers
        const details = await Promise.all(
            printers.map(async (printer) => {
                try {
                    // Check if printer is reachable first
                    await dns.lookup(printer.ip);
                    
                    // For demo purposes, we'll simulate detailed data
                    // In production, you would use SNMP or printer APIs here
                    const printerDetails = await getPrinterDetails(printer);
                    return printerDetails;
                    
                } catch (error) {
                    console.error(`Error getting details for ${printer.name}:`, error.message);
                    return getOfflinePrinterDetails(printer);
                }
            })
        );

        console.log('Successfully generated details for all printers');
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
async function getPrinterDetails(printer) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const isColorPrinter = printer.name.toLowerCase().includes('color');
    const isOnline = Math.random() > 0.1; // 90% chance of being online for demo
    
    if (!isOnline) {
        return getOfflinePrinterDetails(printer);
    }
    
    // Generate realistic demo data
    return {
        name: printer.name,
        ip: printer.ip,
        model: getPrinterModel(printer.name),
        status: 'online',
        toners: generateTonerLevels(isColorPrinter),
        trays: generateTrayStatus(),
        pageCount: Math.floor(Math.random() * 50000) + 1000,
        timestamp: new Date().toISOString()
    };
}

function generateTonerLevels(isColorPrinter) {
    if (isColorPrinter) {
        return [
            { color: 'Black', level: Math.floor(Math.random() * 40) + 30 },
            { color: 'Cyan', level: Math.floor(Math.random() * 50) + 20 },
            { color: 'Magenta', level: Math.floor(Math.random() * 60) + 15 },
            { color: 'Yellow', level: Math.floor(Math.random() * 70) + 10 }
        ];
    } else {
        return [
            { color: 'Black', level: Math.floor(Math.random() * 50) + 40 }
        ];
    }
}

function generateTrayStatus() {
    const statusOptions = ['OK', 'LOW', 'EMPTY'];
    const weights = [0.7, 0.2, 0.1]; // 70% OK, 20% LOW, 10% EMPTY
    
    return [
        { 
            name: 'Tray 1', 
            status: getWeightedRandom(statusOptions, weights),
            capacity: 250,
            current: Math.floor(Math.random() * 250)
        },
        { 
            name: 'Tray 2', 
            status: getWeightedRandom(statusOptions, weights),
            capacity: 250,
            current: Math.floor(Math.random() * 250)
        },
        { 
            name: 'Manual Feed', 
            status: 'OK',
            capacity: 50,
            current: Math.floor(Math.random() * 50)
        }
    ];
}

function getWeightedRandom(options, weights) {
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < options.length; i++) {
        sum += weights[i];
        if (random <= sum) return options[i];
    }
    return options[0];
}

function getPrinterModel(printerName) {
    const models = {
        'color': 'Canon imageCLASS MF743Cdw',
        'oneill': 'HP LaserJet Pro M404dn',
        '2150': 'Xerox VersaLink C405',
        'wihd': 'Brother HL-L8360CDW'
    };
    
    const nameLower = printerName.toLowerCase();
    if (nameLower.includes('color')) return models.color;
    if (nameLower.includes('oneill')) return models.oneill;
    if (nameLower.includes('2150')) return models['2150'];
    if (nameLower.includes('wihd')) return models.wihd;
    
    return 'HP LaserJet Pro M404dn';
}

function getOfflinePrinterDetails(printer) {
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
            { name: 'Manual Feed', status: 'UNKNOWN' }
        ],
        error: 'Printer offline or not responding',
        timestamp: new Date().toISOString()
    };
}
