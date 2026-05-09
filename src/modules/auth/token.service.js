const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { raw } = require('express');

/**
 * Token strategy:
 *
 *  - Access token: short-lived JWT (15 min), stateless, sent on every request
 *  - Refresh token: long-lived random string (30 days), stateful, used ONLY
 *    to get a new access token. Stored hashed in DB. Single-use rotation.
 *
 * Why this split:
 *  - Short access token = small blast radius if leaked
 *  - Long refresh token in DB = revocable on logout / password change
 *  - Single-use rotation = stolen refresh token detected when same one is used twice
 */

// ============================================================
// Access tokens (JWT)
// ============================================================

/**
 * Generate a short-lived access token (JWT).
 * Stateless — server doesn't store it. Validated by signature only.
 */

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            type: 'access'
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
        }
    );
}

/**
 * SHA-256 hash a refresh token before storing.
 *
 * Why not bcrypt?
 *  - Bcrypt is for passwords (low-entropy human input). Slow on purpose.
 *  - Refresh tokens are 64 bytes of crypto-random — already high-entropy.
 *  - SHA-256 is fast and sufficient. We just need to make a DB dump useless.
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new refresh token, store its hash in DB, return the raw token.
 * The raw token is returned to the client ONCE. After that, only the hash exists.
 */
const generateRefreshToken = async(userId) => {
    const rawToken = crypto.randomBytes(64).toString('base64url');
    const tokenHash = hashToken(rawToken);

    const expiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10)
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    return rawToken;
}

/**
 * Validate a refresh token and rotate it (single-use).
 *
 *  - Hash the incoming token, find matching DB row
 *  - Reject if not found, expired, or already revoked
 *  - Mark old token as revoked
 *  - Generate and store a new refresh token
 *  - Return new pair: { accessToken, refreshToken }
 *
 * If a token has already been revoked AND someone tries to use it,
 * that's a strong signal of compromise. Future enhancement: revoke
 * ALL tokens for that user and force re-login.
 */
const rotateRefreshToken = async (rawToken) => {
    if(!rawToken){
        throw new Error('Refresh token is required');
    }

    const tokenHash = hashToken(rawToken);

    const stored = await prisma.refreshToken.findUnique({
        where: {tokenHash},
        include: {user: true}
    })

    if(!stored){
        throw new Error('Invalid refresh token');
    }

    if(stored.revokedAt){
        throw new Error('Refresh token has been revoked');
    }

    if(stored.expiresAt < new Date()){
        throw new Error('Refresh token has been expired');
    }

    const newRawToken = crypto.randomBytes(64).toString('base64url');
    const newTokenHash = hashToken(newRawToken);
    const expiredInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30',10);
    const newExpiresAt = new Date(Date.now() + expiredInDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
        prisma.refreshToken.update({
            where: {id: stored.id},
            data: {revokedAt: new Date()}
        }),
        prisma.refreshToken.create({
            data: {
                userId: stored.userId,
                tokenHash: newTokenHash,
                expiresAt: newExpiresAt
            },
        }),
    ]);

    const accessToken = generateAccessToken(stored.user);

    return {
        accessToken,
        refreshToken: newRawToken,
        user: {
            id: stored.user.id,
            name: stored.user.name,
            email: stored.user.email
        },
    };
};

/**
 * Revoke a single refresh token (logout from current session).
 */

const revokeRefreshToken = async(rawToken) => {
    if (!rawToken) return;

    const tokenHash = hashToken(rawToken);

    await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

/**
 * Revoke ALL refresh tokens for a user (logout from all devices,
 * or after password change / suspected compromise).
 */

const revokeAllRefreshToken = async(userId) => {
    await prisma.refreshToken.updateMany({
        where: {userId, revokedAt: null},
        data: {revokedAt: new Date()}
    });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllRefreshToken
}