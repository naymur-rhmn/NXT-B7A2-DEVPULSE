import { pool } from "../../db";
import bcrypt from "bcrypt"
import type { IUser } from "./auth.interface";

const userRegisterIntoDB = async (payload: IUser) => {
    const {name, email, password, role = "contributor"} = payload;

    const hashPassword = bcrypt.hash(password, 10);

    const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `, [name, email, hashPassword, role])

    delete result.rows[0].password;
    
    return result;
}

export const authService = {
    userRegisterIntoDB,

}