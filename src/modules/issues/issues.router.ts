import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth.middleware";
import { USER_ROLE } from "../../types";
import updateIssue from "../../middleware/updateIssue.middleware";
import guard from "../../middleware/gurad.middleware";

const router = Router();

router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssue)
router.get("/", issuesController.getAllIssues)
router.get("/:id", issuesController.getSingleIssue)

router.patch(
    "/:id",
    auth(USER_ROLE.contributor, USER_ROLE.maintainer),
    updateIssue,
    issuesController.updateIssue
);

router.delete("/:id", guard, issuesController.deleteIssue)


export const issuesRouter= router;