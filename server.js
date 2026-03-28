require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const affirmationRoutes = require('./routes/affirmations');
const scheduleRoutes = require('./routes/schedule');
const ecoTherapyRoutes = require('./routes/eco-therapy');

const PORT = process.env.PORT || 3000;
const FRONTEND = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    try {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } catch (e) {
        console.warn('Stripe package error:', e.message);
    }
} else {
    console.warn('⚠️  STRIPE_SECRET_KEY missing — /api/create-checkout-session will return setup instructions.');
}

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname));

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/affirmations', affirmationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/eco-therapy', ecoTherapyRoutes);

app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
        return res.status(503).json({
            error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file and restart the server.',
            code: 'STRIPE_NOT_CONFIGURED'
        });
    }

    const { plan } = req.body || {};
    const userId = req.body?.userId || 'guest';

    let line_items;
    if (plan === 'premium_yearly' && process.env.STRIPE_PRICE_YEARLY) {
        line_items = [{ price: process.env.STRIPE_PRICE_YEARLY, quantity: 1 }];
    } else if (plan === 'premium_monthly' || plan === 'premium') {
        if (process.env.STRIPE_PRICE_MONTHLY) {
            line_items = [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }];
        } else {
            line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Cheerly Premium — monthly' },
                    recurring: { interval: 'month' },
                    unit_amount: 999
                },
                quantity: 1
            }];
        }
    } else {
        return res.status(400).json({ error: 'Invalid plan. Use premium_monthly or premium_yearly.' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'subscription',
            success_url: `${FRONTEND}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND}/payment-cancel.html`,
            client_reference_id: String(userId).slice(0, 200)
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe checkout error:', err);
        res.status(500).json({
            error: err.message || 'Failed to create checkout session. Check Stripe Dashboard and price IDs.'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Cheerly Live Up API is running',
        stripe: !!stripe,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || true,
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('chat message', (data) => {
        if (data && data.channel === 'general') {
            io.emit('chat message', data);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Cheerly Live Up server running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`💳 Stripe checkout: POST http://localhost:${PORT}/api/create-checkout-session`);
});
