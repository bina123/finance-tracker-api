const prisma = require('../../config/prisma');

const create = async (userId, data) => {
    const { categoryId, amount, month, year } = data;

    // Verify category exists and is EXPENSE type
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        throw new Error('Category not found');
    }

    if (category.type !== 'EXPENSE') {
        throw new Error('Budgets can only be set for EXPENSE categories');
    }

    // Check duplicate — one budget per category per month/year
    const existing = await prisma.budget.findUnique({
        where: {
            userId_categoryId_month_year: {
                userId,
                categoryId,
                month,
                year
            }
        }
    });

    if (existing) {
        throw new Error(
            'Budget already exists for this category and month'
        );
    }

    return await prisma.budget.create({
        data: { userId, categoryId, amount, month, year },
        include: { category: true }
    });
};

const getAll = async (userId, month, year) => {
    const where = { userId };

    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const budgets = await prisma.budget.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
    });

    // For each budget calculate actual spending
    const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
            const spending = await prisma.transaction.aggregate({
                where: {
                    userId,
                    categoryId: budget.categoryId,
                    type: 'EXPENSE',
                    deletedAt: null,
                    date: {
                        gte: new Date(budget.year, budget.month - 1, 1),
                        lte: new Date(budget.year, budget.month, 0)
                    }
                },
                _sum: { amount: true }
            });

            const spent = Number(spending._sum.amount || 0);
            const budgetAmount = Number(budget.amount);
            const remaining = budgetAmount - spent;
            const percentage = Math.round((spent / budgetAmount) * 100);

            return {
                ...budget,
                spent,
                remaining,
                percentage,
                isOverBudget: spent > budgetAmount
            };
        })
    );

    return budgetsWithSpending;
};

const getById = async (userId, id) => {
    const budget = await prisma.budget.findFirst({
        where: { id, userId },
        include: { category: true }
    });

    if (!budget) {
        throw new Error('Budget not found');
    }

    // Calculate actual spending
    const spending = await prisma.transaction.aggregate({
        where: {
            userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            deletedAt: null,
            date: {
                gte: new Date(budget.year, budget.month - 1, 1),
                lte: new Date(budget.year, budget.month, 0)
            }
        },
        _sum: { amount: true }
    });

    const spent = Number(spending._sum.amount || 0);
    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - spent;
    const percentage = Math.round((spent / budgetAmount) * 100);

    return {
        ...budget,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budgetAmount
    };
};

const update = async (userId, id, { amount }) => {
    const budget = await prisma.budget.findFirst({
        where: { id, userId }
    });

    if (!budget) {
        throw new Error('Budget not found');
    }

    return await prisma.budget.update({
        where: { id },
        data: { amount },
        include: { category: true }
    });
};

const remove = async (userId, id) => {
    const budget = await prisma.budget.findFirst({
        where: { id, userId }
    });

    if (!budget) {
        throw new Error('Budget not found');
    }

    await prisma.budget.delete({ where: { id } });

    return { message: 'Budget deleted successfully' };
};

// Summary — all budgets for a month with over-budget alerts
const getSummary = async (userId, month, year) => {
    const budgets = await getAll(userId, month, year);

    const overBudget = budgets.filter((b) => b.isOverBudget);
    const onTrack = budgets.filter((b) => !b.isOverBudget);

    const totalBudgeted = budgets.reduce(
        (sum, b) => sum + Number(b.amount), 0
    );
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    return {
        month,
        year,
        totalBudgeted,
        totalSpent,
        totalRemaining: totalBudgeted - totalSpent,
        overBudgetCount: overBudget.length,
        onTrackCount: onTrack.length,
        overBudgetCategories: overBudget.map((b) => ({
            category: b.category.name,
            budgeted: Number(b.amount),
            spent: b.spent,
            overBy: b.spent - Number(b.amount)
        })),
        budgets
    };
};

module.exports = { create, getAll, getById, update, remove, getSummary };