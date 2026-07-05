/**
 * @file server.js
 * @description Moravian Builders LLC - Production Web Services Layer
 * Minimal Express backend for static frontend serving + API routes
 * 
 * Deployment: Render Web Service
 * Command: npm start
 * Port: Automatically set by Render via process.env.PORT
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ================== CONFIG ==================
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// ================== MIDDLEWARE ==================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files (frontend application)
app.use(express.static(path.join(__dirname, '/')));

// ================== HEALTH CHECK ==================
/**
 * Health check endpoint
 * Used by Render for service verification
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'mbllc-estimator',
        version: '1.0.0',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// ================== API ROUTES ==================

/**
 * POST /api/leads
 * 
 * Receives lead submission from frontend with:
 * - Lead contact information (name, email, phone, location)
 * - Building configuration (dimensions, colors, features)
 * - Pricing breakdown and total
 * - Timestamp
 * 
 * Currently logs to console.
 * TODO: Integrate with:
 * - MongoDB/PostgreSQL for persistence
 * - SendGrid/AWS SES for email notifications
 * - Stripe for payment processing
 * - Admin dashboard for lead management
 */
app.post('/api/leads', (req, res) => {
    try {
        const { lead, configuration, pricing, timestamp } = req.body;

        // Validate required fields
        if (!lead || !lead.email || !lead.fullname) {
            return res.status(400).json({
                success: false,
                error: 'Missing required lead fields'
            });
        }

        // Log lead (production: save to database)
        console.log('===== NEW LEAD SUBMISSION =====');
        console.log('Name:', lead.fullname);
        console.log('Email:', lead.email);
        console.log('Phone:', lead.phone);
        console.log('Location:', lead.city, lead.state);
        console.log('Building:', configuration?.building);
        console.log('Pricing Total:', pricing?.total);
        console.log('Timestamp:', timestamp);
        console.log('===============================\n');

        // TODO: Save to database
        // TODO: Send confirmation email
        // TODO: Alert sales team

        res.status(200).json({
            success: true,
            message: 'Lead received successfully',
            leadId: `lead-${Date.now()}` // Placeholder - use DB ID in production
        });
    } catch (error) {
        console.error('Lead submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error processing lead'
        });
    }
});

// ================== SPA FALLBACK ==================
/**
 * Serve index.html for all unmatched routes
 * Allows client-side routing to work correctly
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   MBLLC Estimator - Production Server  ║
╠════════════════════════════════════════╣
║ Port:        ${PORT}
║ Environment: ${NODE_ENV}
║ Status:      ✅ Running
╚════════════════════════════════════════╝
    `);
    console.log(`Access: http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received - shutting down gracefully');
    process.exit(0);
});
