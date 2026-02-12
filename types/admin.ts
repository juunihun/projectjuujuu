
export interface ActivityLog {
    id: number;
    user_id: number;
    action: string;
    details: string;
    created_at: string;
    user_name?: string;
    user_role?: string;
}
