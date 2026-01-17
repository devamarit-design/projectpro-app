import { User } from "@/context/project-context"

// Define all possible actions in the system
export type Action =
    | "USER_CREATE"
    | "USER_UPDATE"
    | "USER_DELETE"
    | "COMPANY_UPDATE"
    | "PROJECT_CREATE"
    | "PROJECT_UPDATE"
    | "PROJECT_DELETE"
    | "EXPENSE_CREATE"
    | "EXPENSE_APPROVE"
    | "EXPENSE_DELETE"
    | "INCOME_CREATE"
    | "INCOME_UPDATE"
    | "INCOME_DELETE"
    | "FINANCIAL_VIEW"
    | "TEAM_VIEW"

export type Role = "Owner" | "Admin" | "Manager" | "Accountant" | "Staff" | string

// Define permissions for each role
export const PERMISSIONS: Record<Role, Action[]> = {
    Owner: [
        "USER_CREATE", "USER_UPDATE", "USER_DELETE",
        "COMPANY_UPDATE",
        "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE",
        "EXPENSE_CREATE", "EXPENSE_APPROVE", "EXPENSE_DELETE",
        "INCOME_CREATE", "INCOME_UPDATE", "INCOME_DELETE",
        "FINANCIAL_VIEW", "TEAM_VIEW"
    ],
    Admin: [
        "USER_CREATE", "USER_UPDATE", "USER_DELETE",
        "COMPANY_UPDATE",
        "PROJECT_CREATE", "PROJECT_UPDATE",
        "EXPENSE_CREATE", "EXPENSE_APPROVE", "EXPENSE_DELETE",
        "INCOME_CREATE", "INCOME_UPDATE", "INCOME_DELETE",
        "FINANCIAL_VIEW", "TEAM_VIEW"
    ],
    Manager: [
        "PROJECT_CREATE", "PROJECT_UPDATE",
        "EXPENSE_CREATE", "EXPENSE_APPROVE",
        "FINANCIAL_VIEW",
        "TEAM_VIEW"
    ],
    Accountant: [
        "EXPENSE_CREATE",
        "INCOME_CREATE", "INCOME_UPDATE", "INCOME_DELETE",
        "FINANCIAL_VIEW",
        "TEAM_VIEW"
    ],
    Staff: [
        "EXPENSE_CREATE",
        "TEAM_VIEW"
    ],
    Member: [ // Legacy Role Mapped to Staff
        "EXPENSE_CREATE",
        "TEAM_VIEW"
    ]
}

export function hasPermission(user: User | null, action: Action): boolean {
    if (!user) return false

    // Check if role has the specific permission
    const userPermissions = PERMISSIONS[user.role] || []
    return userPermissions.includes(action)
}
