import dotenv from "dotenv"; 
import path from "path";

dotenv.config({path: path.join(process.cwd(), ".env")});

const config = {
    port: process.env.PORT,
    connection_url: process.env.CONNECTION_STRING as string  ,
    jwt_secret: process.env.JWT_SECRET
}

export default config;