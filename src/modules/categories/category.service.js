const prisma = require('../../config/prisma');

const create = async ({ name, type }) => {
    // Check duplicate
    const existing = await prisma.category.findFirst({
        where: { name, type }
    });

    if (existing) {
        throw new Error('Category already exists');
    }

    return await prisma.category.create({
        data: { name, type }
    });
};

const getAll = async () => {
    return await prisma.category.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

const getById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id }
    });

    if (!category) {
        throw new Error('Category not found');
    }

    return category;
};

const update = async (id, { name }) => {
    await getById(id); // throws if not found

    return await prisma.category.update({
        where: { id },
        data: { name }
    });
};

const remove = async (id) => {
    await getById(id); // throws if not found

    // Check if category is used in transactions
    const used = await prisma.transaction.findFirst({
        where: { categoryId: id }
    });

    if (used) {
        throw new Error(
            'Cannot delete category — it is used in transactions'
        );
    }

    await prisma.category.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
};

module.exports = { create, getAll, getById, update, remove };