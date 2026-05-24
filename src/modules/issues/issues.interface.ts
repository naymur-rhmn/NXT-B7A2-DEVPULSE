export interface IIssue {
    title: string,
    description: string,
    state: 'bug' | 'feature_request',
    type: string
    status?: 'open' | 'in_progress' | 'resolved',
    reporter_id: number
}