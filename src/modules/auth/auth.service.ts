import { pool } from "../../db";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import type { IUser } from "./auth.interface";
import config from "../../config";

const userRegisterIntoDB = async (payload: IUser) => {
    const {name, email, password, role = "contributor"} = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `, [name, email, hashPassword, role])

    delete result.rows[0].password;

    return result;
}

const userloginFromDB = async (payload : {email:string, password: string}) => {
    const {email, password} = payload;
    const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `, [email]);

    if (userData.rows.length === 0) {
        throw new Error("Invalid Credentials!");
    }

    const user = userData.rows[0]

    const passwordMatch  = await bcrypt.compare( password, user.password); 
     
    if (!passwordMatch) {
        throw new Error("Invalid Credentials!");
    }
    
    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
    }

    const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {expiresIn: "1d"} )   

    delete user.password;
 
    return {
        token: accessToken,
        user: user
    }
}

export const authService = {
    userRegisterIntoDB,
    userloginFromDB 
}