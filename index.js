import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import v1Router from './src/api/routes/v1/index.route.js';
import { ApiError } from './src/utils/ApiError.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerOptions from './src/config/swagger.config.js';
// Load environment variables
dotenv.config();
console.log('--- Environment Variable Check ---');
console.log('Port:', process.env.PORT);
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass Loaded:', process.env.EMAIL_PASS ? 'Yes' : 'NO');
console.log('---------------------------------');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB();

// --- Core Middlewares ---
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));


app.use('/api/v1', v1Router);
const swaggerSpecs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // For unexpected errors
    console.error(err);
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});