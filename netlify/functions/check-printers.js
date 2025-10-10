const dns = require('dns').promises;

exports.handler = async function(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight request
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

        // Check status for all printers
        const results = await Promise.all(
            printers.map(async (printer) => {
                const startTime = Date.now();
                try {
                    // Try to resolve the hostname first
                    await dns.lookup(printer.ip);
                    
                    // For Netlify functions, we can't directly ping, so we'll simulate
                    // or use HTTP requests to common printer ports
                    const status = await checkPrinterPort(printer.ip);
                    
                    return {
                        name: printer.name,
                        ip: printer.ip,
                        status: status ? 'online' : 'offline',
                        responseTime: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        name: printer.name,
                        ip: printer.ip,
                        status: 'offline',
                        responseTime: null,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            })
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(results)
        };

    } catch (error) {
        console.error('Error in check-printers function:', error);
        
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

// Helper function to check printer status
// Note: This is a simplified check since we can't do ICMP ping in Netlify functions
async function checkPrinterPort(ip) {
    // In a real implementation, you might want to:
    // 1. Use a third-party ping service
    // 2. Check common printer ports (9100, 515, 631)
    // 3. Use a server that can perform actual pings
    
    // For now, we'll simulate the check
    // In production, you might want to replace this with actual port checking
    // or use a service like ping.js or similar
    
    try {
        // This is a placeholder - you'd need to implement actual port checking
        // For demo purposes, we'll return a simulated result
        return Math.random() > 0.3; // 70% chance of being online for demo
    } catch (error) {
        return false;
    }
}
