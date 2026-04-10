import { db } from "@/server/db/client";

type CreateSessionRecord = {
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export const authRepository = {
  findUserByEmail(email: string) {
    return db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        profile: true,
        member: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });
  },

  findUserById(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        member: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });
  },

  findSessionByTokenHash(sessionTokenHash: string) {
    return db.session.findUnique({
      where: { sessionTokenHash },
      include: {
        user: {
          include: {
            profile: true,
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
            notifications: {
              where: {
                readAt: null,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  },

  createSession(data: CreateSessionRecord) {
    return db.session.create({
      data,
    });
  },

  updateSessionLastSeen(sessionId: string) {
    return db.session.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date(),
      },
    });
  },

  deleteSessionByTokenHash(sessionTokenHash: string) {
    return db.session.deleteMany({
      where: { sessionTokenHash },
    });
  },

  deleteExpiredSessions() {
    return db.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  async recordSuccessfulLogin(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  },
};
