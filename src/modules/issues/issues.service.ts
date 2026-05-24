
import { pool } from "../../db"
import { ISSUE_SORT, ISSUE_STATUS, ISSUE_TYPE, type TFilter } from "../../types";
import type { IIssue } from "./issues.interface"  

const createIssuesIntoDB = async (payload: IIssue, ) => {
    const { title, description, type, reporter_id } = payload; 
    console.log(reporter_id)
    
    const issue = await pool.query(`
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `, [title, description, type, reporter_id])
    
    return issue;
}



const getAllIssuesFromDB = async (filter: TFilter) => {
    const { sort, type, status } = filter;
    let queryString = `SELECT * FROM issues`
 
    const condition = []
    const values = []

    if(type === ISSUE_TYPE.bug || type === ISSUE_TYPE.feature_request) {
        condition.push(`type = $${values.length + 1}`);
        values.push(type)
    }

    if(status && status === ISSUE_STATUS.open || status === ISSUE_STATUS.in_progress || status === ISSUE_STATUS.resolved) {
        condition.push(`type = $${values.length + 1}`);
        values.push(status);
    }

    if(condition.length > 0) {
        queryString = queryString + ` WHERE ` + condition.join(" AND ");
    }


    if(sort === ISSUE_SORT.newest) {
        queryString += ` ORDER BY created_at ASC`
    } else if (sort === ISSUE_SORT.oldest) {
        queryString += ` ORDER BY created_at DESC`
    }


    const issueResult = await pool.query(queryString, values)
    const issues = issueResult.rows;
 
 
    const reporterIds = [...new Set(issues.map(i => i.reporter_id))];
 
    const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
    );

    const users = usersResult.rows; 

    const userMap = new Map(users.map(user => [user.id, user]));
    
    const result = issues.map(issue => {
        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: userMap.get(issue.reporter_id) || null,
            created_at: issue.created_at,
            updated_at: issue.updated_at
        }
    })

    return result;
}

const getSingleIssueFromDB = async (id: string) => {
    const res = await pool.query(`
            SELECT * FROM issues WHERE id=$1
        `, [id])
    
    const issue = res.rows[0];

    
    const reporterId = issue.reporter_id;
 
    const userResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id=$1
    `,
    [reporterId]
    );

    const users = userResult.rows[0]; 

    const result =  {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: {...users},
        created_at: issue.created_at,
        updated_at: issue.updated_at
    } 
    
    return result;
}


export const issuesService = {
    createIssuesIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB
}