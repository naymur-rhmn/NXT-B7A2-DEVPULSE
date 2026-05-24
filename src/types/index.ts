export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer", 
} as const;

export const ISSUE_TYPE = {
  bug: "bug",
  feature_request: "feature_request"
}  as const;

export const ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved"
}  as const;

export const ISSUE_SORT = {
  newest: "newest",
  oldest : "oldest"
}  as const;


// export type Types = ;

export type ROLES = "contributor" | "maintainer" ;