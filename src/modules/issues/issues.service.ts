
import { pool } from "../../db"
import type { IIssue } from "./issues.interface"  

const createIssuesIntoDB = async (payload: IIssue, ) => {
    const { title, description, type, reporter_id } = payload; 
    console.log(reporter_id)
    
    const issue = await pool.query(`
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `, [title, description, type, reporter_id])
    
    return issue;
}

export const issuesService = {
    createIssuesIntoDB,
}