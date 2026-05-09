const bcrypt = require('bcrypt');
const prisma = require('../../config/prisma');
const tokenService = require('./token.service');

const register = async ({ name, email, password }) => {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) {
        throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    // Issue access + refresh token pair
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    // Generate token
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        },
        accessToken,
        refreshToken
    };
};

const refresh = async(rawRefreshToken) => {
    return await tokenService.rotateRefreshToken(rawRefreshToken);
}

const logout = async(rawRefreshToken) => {
    return await tokenService.revokeRefreshToken(rawRefreshToken);
}

const logoutAll = async(userId) => {
    return await tokenService.revokeAllRefreshToken(userId);
}

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

module.exports = { register, login,refresh, logout, logoutAll ,getMe };