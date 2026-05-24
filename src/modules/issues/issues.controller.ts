import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
    try { 
        const reporter_id = req.user?.id

        const payload = {
            ...req.body,
            reporter_id
        }
       const result = await issuesService.createIssuesIntoDB(payload ) 

       sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully!",
            data: result.rows[0]
        })

    } catch (error: any) {
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: error.message,
            error: error.message
        })
    }
}

const getAllIssues = async  (req: Request, res: Response) =>  {
    try {  
        const result = await issuesService.getAllIssuesFromDB(req.query)  
        
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Data retrieved Successfully!",
            data: result
        })
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: error.message,
            error: error.message
        })
    }
}

export const issuesController = {
    createIssue,
    getAllIssues
}