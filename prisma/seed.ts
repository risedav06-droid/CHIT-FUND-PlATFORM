import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/modules/auth/auth.password";
import { addMonthsAtUtcDay } from "../src/lib/dates";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the demo seed.");
}

const demoPassword = process.env.DEMO_PASSWORD || "Pilot@12345";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

function money(value: number) {
  return value.toFixed(2);
}

async function upsertDemoUsers() {
  const passwordHash = hashPassword(demoPassword);

  const definitions = [
    {
      email: "pilot.superadmin@chitflow.local",
      role: "SUPER_ADMIN" as const,
      firstName: "Asha",
      lastName: "Reddy",
      designation: "Pilot Super Admin",
      phone: "9000000001",
    },
    {
      email: "pilot.organizer@chitflow.local",
      role: "ORGANIZER" as const,
      firstName: "Vikram",
      lastName: "Rao",
      designation: "Pilot Organizer",
      phone: "9000000002",
    },
    {
      email: "pilot.agent@chitflow.local",
      role: "AGENT" as const,
      firstName: "Nisha",
      lastName: "Kiran",
      designation: "Collection Agent",
      phone: "9000000003",
    },
    {
      email: "pilot.member@chitflow.local",
      role: "MEMBER" as const,
      firstName: "Suresh",
      lastName: "Varma",
      designation: "Member Login",
      phone: "9000000004",
    },
  ];

  const users: Record<string, { id: string; email: string; role: typeof definitions[number]["role"] }> = {};

  for (const definition of definitions) {
    const user = await db.user.upsert({
      where: {
        email: definition.email,
      },
      update: {
        role: definition.role,
        isActive: true,
        passwordHash,
      },
      create: {
        email: definition.email,
        role: definition.role,
        isActive: true,
        passwordHash,
      },
    });

    await db.profile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        firstName: definition.firstName,
        lastName: definition.lastName,
        designation: definition.designation,
        phone: definition.phone,
      },
      create: {
        userId: user.id,
        firstName: definition.firstName,
        lastName: definition.lastName,
        designation: definition.designation,
        phone: definition.phone,
      },
    });

    users[definition.role] = {
      id: user.id,
      email: user.email,
      role: definition.role,
    };
  }

  return users;
}

async function ensureMemberLink(memberUserId: string) {
  const existingLinkedMember = await db.member.findFirst({
    where: {
      userId: memberUserId,
    },
  });

  if (existingLinkedMember) {
    return existingLinkedMember;
  }

  const firstAvailableMember = await db.member.findFirst({
    where: {
      userId: null,
      status: {
        in: ["ACTIVE", "PENDING_KYC"],
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  if (firstAvailableMember) {
    return db.member.update({
      where: {
        id: firstAvailableMember.id,
      },
      data: {
        userId: memberUserId,
      },
    });
  }

  return db.member.create({
    data: {
      userId: memberUserId,
      memberCode: "MBR-DEMO-001",
      firstName: "Suresh",
      lastName: "Varma",
      primaryPhone: "9000000004",
      primaryEmail: "pilot.member@chitflow.local",
      city: "Hyderabad",
      state: "Telangana",
      addressLine1: "Pilot Seed Member",
      postalCode: "500001",
      notes: "Demo member account for controlled pilot usage.",
    },
  });
}

async function ensureMemberEnrollment(memberId: string) {
  const existingEnrollment = await db.chitEnrollment.findFirst({
    where: {
      memberId,
      isActive: true,
    },
  });

  if (existingEnrollment) {
    return existingEnrollment;
  }

  const group = await db.chitGroup.findFirst({
    where: {
      status: {
        in: ["OPEN", "ACTIVE"],
      },
    },
    orderBy: [{ startDate: "asc" }],
    include: {
      enrollments: {
        orderBy: [{ ticketNumber: "asc" }],
      },
    },
  });

  if (!group || group.enrollments.length >= group.ticketCount) {
    return null;
  }

  const usedTicketNumbers = new Set(group.enrollments.map((enrollment) => enrollment.ticketNumber));
  let ticketNumber = 1;

  while (usedTicketNumbers.has(ticketNumber)) {
    ticketNumber += 1;
  }

  const preferredDay = group.startDate.getUTCDate();
  const now = new Date();

  return db.$transaction(async (tx) => {
    const enrollment = await tx.chitEnrollment.create({
      data: {
        chitGroupId: group.id,
        memberId,
        ticketNumber,
        isActive: true,
      },
    });

    await tx.installment.createMany({
      data: Array.from({ length: group.durationMonths }, (_, index) => {
        const dueDate = addMonthsAtUtcDay(group.startDate, index, preferredDay);

        return {
          chitGroupId: group.id,
          chitEnrollmentId: enrollment.id,
          cycleNumber: index + 1,
          dueDate,
          dueAmount: money(Number(group.installmentAmount)),
          status: dueDate < now ? "OVERDUE" : "PENDING",
        };
      }),
    });

    return enrollment;
  });
}

async function seedNotifications(userIds: string[]) {
  for (const userId of userIds) {
    const existing = await db.notification.findFirst({
      where: {
        userId,
        eventKey: `seed-welcome:${userId}`,
      },
    });

    if (existing) {
      continue;
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Pilot access ready",
        message: "Your demo login is ready for the controlled pilot workspace.",
        linkHref: "/dashboard",
        eventKey: `seed-welcome:${userId}`,
      },
    });

    await db.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: "IN_APP",
        providerKey: "seed",
        status: "SENT",
        deliveredAt: new Date(),
        responseCode: "SEEDED",
      },
    });
  }
}

async function main() {
  const users = await upsertDemoUsers();
  const member = await ensureMemberLink(users.MEMBER.id);
  await ensureMemberEnrollment(member.id);
  await seedNotifications([
    users.SUPER_ADMIN.id,
    users.ORGANIZER.id,
    users.AGENT.id,
    users.MEMBER.id,
  ]);

  console.log("Demo access seeded successfully.");
  console.log("Demo password:", demoPassword);
  console.log("Users:");
  console.log(" - pilot.superadmin@chitflow.local");
  console.log(" - pilot.organizer@chitflow.local");
  console.log(" - pilot.agent@chitflow.local");
  console.log(" - pilot.member@chitflow.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
