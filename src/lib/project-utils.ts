import { Expense, ExpenseCategory } from "@/context/project-context"

/**
 * Calculates total expenses per project from actual expense data.
 * Correctly handles split bill expenses and items without double counting.
 */
export function getExpensesByProject(expenses: Expense[]): Record<string, number> {
    const expensesByProject: Record<string, number> = {}
    expenses.forEach(expense => {
        if (expense.isDeleted || expense.status === 'Unpaid') return

        const hasItemProjectIds = expense.items?.some(i => i.projectId)
        if (hasItemProjectIds) {
            expense.items?.forEach(item => {
                const pid = item.projectId || expense.projectId
                if (pid) {
                    expensesByProject[pid] = (expensesByProject[pid] || 0) + (Number(item.amount) || 0)
                }
            })
        } else if (expense.projectId) {
            expensesByProject[expense.projectId] = (expensesByProject[expense.projectId] || 0) + (expense.totalValue || 0)
        }
    })
    return expensesByProject
}

/**
 * Calculates total expense amount for a single project.
 */
export function getExpenseAmountForProject(expense: Expense, projectId: string): number {
    if (expense.isDeleted || expense.status === 'Unpaid') return 0

    const hasItemProjectIds = expense.items?.some(i => i.projectId)
    if (hasItemProjectIds) {
        return expense.items?.reduce((sum, item) => {
            const pid = item.projectId || expense.projectId
            return pid === projectId ? sum + (Number(item.amount) || 0) : sum
        }, 0) || 0
    }
    return expense.projectId === projectId ? (expense.totalValue || 0) : 0
}

/**
 * Calculates total expense amount for a specific category within a project.
 */
export function getCategoryExpenseForProject(
    expenses: Expense[],
    projectId: string,
    category: ExpenseCategory
): number {
    return expenses.reduce((total, expense) => {
        if (expense.isDeleted || expense.status === 'Unpaid') return total

        const hasItemProjectIds = expense.items?.some(i => i.projectId)
        if (hasItemProjectIds) {
            const itemSum = expense.items?.reduce((sum, item) => {
                const pid = item.projectId || expense.projectId
                const cat = item.category || expense.category
                if (pid === projectId && cat === category) {
                    return sum + (Number(item.amount) || 0)
                }
                return sum
            }, 0) || 0
            return total + itemSum
        } else if (expense.projectId === projectId && expense.category === category) {
            return total + (expense.totalValue || 0)
        }

        return total
    }, 0)
}
