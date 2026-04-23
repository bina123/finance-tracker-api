const prisma = require('../../config/prisma');

// Helper — create double entry ledger entries
const createLedgerEntries = async (
    tx,
    transactionId,
    type,
    amount,
    currency
) => {
    if (type === 'EXPENSE') {
        // Expense — debit cash account, credit expense account
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId,
                    accountName: 'Cash Account',
                    entryType: 'DEBIT',
                    amount,
                    currency
                },
                {
                    transactionId,
                    accountName: 'Expense Account',
                    entryType: 'CREDIT',
                    amount,
                    currency
                }
            ]
        });
    } else {
        // Income — debit cash account, credit income account
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId,
                    accountName: 'Cash Account',
                    entryType: 'CREDIT',
                    amount,
                    currency
                },
                {
                    transactionId,
                    accountName: 'Income Account',
                    entryType: 'DEBIT',
                    amount,
                    currency
                }
            ]
        });
    }
};

const create = async (userId, data) => {
    const {
        categoryId,
        type,
        amount,
        currency = 'INR',
        description,
        date,
        idempotencyKey
    } = data;

    // Check idempotency — same key means duplicate request
    const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey }
    });

    if (existing) {
        return {
            transaction: existing,
            isDuplicate: true,
            message: 'Duplicate request — returning existing transaction'
        };
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        throw new Error('Category not found');
    }

    // Verify category type matches transaction type
    if (category.type !== type) {
        throw new Error(
            `Category type mismatch — category is ${category.type} but transaction is ${type}`
        );
    }

    // Create transaction + ledger entries in single DB transaction
    // If anything fails — everything rolls back
    const result = await prisma.$transaction(async (tx) => {
        // Create transaction record
        const transaction = await tx.transaction.create({
            data: {
                userId,
                categoryId,
                type,
                amount,
                currency,
                description,
                date: new Date(date),
                idempotencyKey
            },
            include: { category: true }
        });

        // Create double entry ledger entries
        await createLedgerEntries(
            tx,
            transaction.id,
            type,
            amount,
            currency
        );

        // Create audit log
        await tx.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'Transaction',
                entityId: transaction.id,
                changes: {
                    type,
                    amount,
                    currency,
                    categoryId,
                    date
                }
            }
        });

        return transaction;
    });

    return {
        transaction: result,
        isDuplicate: false,
        message: 'Transaction created successfully'
    };
};

const getAll = async (userId, filters) => {
    const {
        type,
        categoryId,
        startDate,
        endDate,
        page = 1,
        limit = 10
    } = filters;

    const where = {
        userId,
        deletedAt: null // soft delete filter
    };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: { category: true },
            orderBy: { date: 'desc' },
            skip,
            take: limit
        }),
        prisma.transaction.count({ where })
    ]);

    return {
        data: transactions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getById = async (userId, id) => {
    const transaction = await prisma.transaction.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
            category: true,
            ledgerEntries: true
        }
    });

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    return transaction;
};

const update = async (userId, id, data) => {
    const transaction = await getById(userId, id);

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.transaction.update({
            where: { id },
            data: {
                description: data.description ?? transaction.description,
                date: data.date ? new Date(data.date) : transaction.date
            },
            include: { category: true }
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'Transaction',
                entityId: id,
                changes: data
            }
        });

        return result;
    });

    return updated;
};

const remove = async (userId, id) => {
    await getById(userId, id); // throws if not found

    await prisma.$transaction(async (tx) => {
        // Soft delete
        await tx.transaction.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'Transaction',
                entityId: id,
                changes: null
            }
        });
    });

    return { message: 'Transaction deleted successfully' };
};

// Get account balance — sum of all transactions
const getBalance = async (userId) => {
    const transactions = await prisma.transaction.findMany({
        where: { userId, deletedAt: null }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
        if (t.type === 'INCOME') totalIncome += Number(t.amount);
        else totalExpense += Number(t.amount);
    });

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
    };
};

// Verify ledger integrity — debits should equal credits
const verifyLedger = async (userId) => {
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            transaction: { userId }
        }
    });

    let totalDebits = 0;
    let totalCredits = 0;

    entries.forEach((e) => {
        if (e.entryType === 'DEBIT') totalDebits += Number(e.amount);
        else totalCredits += Number(e.amount);
    });

    return {
        totalDebits,
        totalCredits,
        isBalanced: totalDebits === totalCredits,
        difference: totalDebits - totalCredits
    };
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getBalance,
    verifyLedger
};