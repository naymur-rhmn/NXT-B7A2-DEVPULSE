import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
    connectionString: config.connection_url
});

export const initDB = async () => {
    try {
        await pool.query(`
                CREATE TABLE IF NOT EXISTS users(
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,

                    email VARCHAR(50) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role VARCHAR(20) DEFAULT 'contributor',
                    
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
        
        await pool.query(`
                CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR(300) NOT NULL,

                description TEXT NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),

                reporter_id INT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW() 
                )
            `)
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Failed to connect database:", error);
    }
}