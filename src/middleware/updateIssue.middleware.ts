import type { NextFunction, Request, Response } from "express";
import { issuesService } from "../modules/issues/issues.service";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { USER_ROLE } from "../types";
import config from "../config";
import jwtVerify from "../utility/jwtVerify";

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
try {
    const {id} = req.params; 
    const token = req.headers.authorization;

    const issue = await issuesService.getSingleIssueFromDB(id as string);

    if(!issue) {
        throw new Error("not found")
    }
    if(!token) {
        throw new Error("token undefined")
    }

    const decoded = jwtVerify(token as string, config.jwt_secret as string)

    if(!decoded) {
        throw new Error("unauthorized")
    }

    if(decoded.role === USER_ROLE.maintainer) {
        return next();
    }

    if(decoded.role === USER_ROLE.contributor) {
        const isOwner = issue.reporter?.id === req.user?.id
        const isOpen = issue.status === "open"

        if(isOwner && isOpen) {
            return next()
        }

        return res.status(403).json({ message: "Not allowed to update the issue" });
    }
} catch (error) {
   next(error) 
}
}

export default updateIssue