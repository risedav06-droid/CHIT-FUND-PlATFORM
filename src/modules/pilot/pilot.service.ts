import { calculateAuctionPrize } from "@/lib/auctions";
import { getInstallmentMetrics } from "@/lib/installments";
import { toNumber } from "@/lib/utils";
import {
  formatAuthRoleLabel,
  permissionGuards,
  protectedRouteDefinitions,
  type AuthPermission,
} from "@/modules/auth/auth.permissions";
import { pilotRepository } from "@/modules/pilot/pilot.repository";
import { env } from "@/server/env";

const fallbackAuthSecret =
  "local-dev-auth-secret-change-before-pilot-1234567890";

const requiredReferenceMethods = ["BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE"] as const;

const demoAccountDefinitions = [
  {
    email: "pilot.superadmin@chitflow.local",
    role: "SUPER_ADMIN" as const,
    label: "Super admin",
    expectedPath: "/dashboard",
  },
  {
    email: "pilot.organizer@chitflow.local",
    role: "ORGANIZER" as const,
    label: "Organizer",
    expectedPath: "/dashboard",
  },
  {
    email: "pilot.agent@chitflow.local",
    role: "AGENT" as const,
    label: "Agent",
    expectedPath: "/dashboard",
  },
  {
    email: "pilot.member@chitflow.local",
    role: "MEMBER" as const,
    label: "Member",
    expectedPath: "/members/[memberId]",
  },
] as const;

export type PilotReadinessStatus = "pass" | "warn" | "fail";

type PilotReadinessCheck = {
  key: string;
  label: string;
  status: PilotReadinessStatus;
  detail: string;
  items?: string[];
};

type PilotManualCheck = {
  label: string;
  href: string;
  note: string;
};

export type PilotReadinessErrorSummary = {
  title: string;
  description: string;
  nextSteps: string[];
};

function statusRank(status: PilotReadinessStatus) {
  switch (status) {
    case "fail":
      return 2;
    case "warn":
      return 1;
    default:
      return 0;
  }
}

function highestStatus(statuses: PilotReadinessStatus[]) {
  return statuses.reduce<PilotReadinessStatus>((highest, status) => {
    return statusRank(status) > statusRank(highest) ? status : highest;
  }, "pass");
}

function moneyMatches(left: number, right: number) {
  return Math.abs(left - right) < 0.01;
}

function payoutMethodRequiresReference(method: string | null | undefined) {
  return typeof method === "string" && requiredReferenceMethods.includes(
    method as (typeof requiredReferenceMethods)[number],
  );
}

function permissionEntries() {
  return Object.entries(permissionGuards) as Array<
    [AuthPermission, (typeof permissionGuards)[AuthPermission]]
  >;
}

export const pilotService = {
  async getPilotReadiness() {
    const [
      demoUsers,
      installments,
      settledAuctions,
      payouts,
      auditSnapshot,
      notificationSnapshot,
    ] = await Promise.all([
      pilotRepository.listDemoUsers(demoAccountDefinitions.map((account) => account.email)),
      pilotRepository.listInstallmentsForIntegrityCheck(),
      pilotRepository.listSettledAuctionsForIntegrityCheck(),
      pilotRepository.listPayoutsForIntegrityCheck(),
      pilotRepository.getCriticalAuditSnapshot(),
      pilotRepository.getNotificationSnapshot(),
    ]);

    const environmentChecks: PilotReadinessCheck[] = [
      {
        key: "database-url",
        label: "Database connection configured",
        status: env.DATABASE_URL ? "pass" : "fail",
        detail: env.DATABASE_URL
          ? "DATABASE_URL is present for runtime queries and seed access."
          : "DATABASE_URL is missing.",
      },
      {
        key: "auth-secret",
        label: "Production auth secret configured",
        status: env.AUTH_SECRET === fallbackAuthSecret ? "fail" : "pass",
        detail:
          env.AUTH_SECRET === fallbackAuthSecret
            ? "AUTH_SECRET is still using the local development fallback and must be replaced before pilot usage."
            : "AUTH_SECRET is set to a non-fallback value.",
      },
    ];

    const demoAccounts = demoAccountDefinitions.map((definition) => {
      const user = demoUsers.find((entry) => entry.email === definition.email);

      if (!user) {
        return {
          ...definition,
          status: "fail" as const,
          detail: "Seeded account is missing from the database.",
          linkedMemberCode: undefined,
          activeSessions: 0,
          hasWelcomeNotification: false,
        };
      }

      const statuses: PilotReadinessStatus[] = ["pass"];
      const detailParts = [
        user.isActive ? "active" : "inactive",
        `role ${formatAuthRoleLabel(user.role)}`,
      ];

      if (!user.isActive || user.role !== definition.role) {
        statuses.push("fail");
      }

      if (definition.role !== "MEMBER" && !user.profile) {
        statuses.push("warn");
        detailParts.push("profile missing");
      }

      if (definition.role === "MEMBER") {
        if (!user.member) {
          statuses.push("fail");
          detailParts.push("member link missing");
        } else {
          detailParts.push(`linked to ${user.member.memberCode}`);
        }
      }

      if (user.notifications.length === 0) {
        statuses.push("warn");
        detailParts.push("welcome notification missing");
      } else {
        detailParts.push("welcome notification present");
      }

      detailParts.push(
        user.sessions.length > 0
          ? `${user.sessions.length} active session(s)`
          : "no active sessions yet",
      );

      return {
        ...definition,
        status: highestStatus(statuses),
        detail: detailParts.join(" | "),
        linkedMemberCode: user.member?.memberCode,
        activeSessions: user.sessions.length,
        hasWelcomeNotification: user.notifications.length > 0,
      };
    });

    const installmentIssues: string[] = [];

    for (const installment of installments) {
      const paymentsTotal = installment.payments.reduce(
        (sum, payment) => sum + toNumber(payment.amount),
        0,
      );
      const paidAmount = toNumber(installment.paidAmount);
      const dueAmount = toNumber(installment.dueAmount);
      const metrics = getInstallmentMetrics(installment);
      const label = `${installment.chitGroup.code} | ${installment.chitEnrollment.member.memberCode} | cycle ${installment.cycleNumber}`;

      if (!moneyMatches(paymentsTotal, paidAmount)) {
        installmentIssues.push(
          `${label}: payment sum ${paymentsTotal.toFixed(2)} does not match installment paid amount ${paidAmount.toFixed(2)}.`,
        );
      }

      if (paidAmount - dueAmount > 0.01) {
        installmentIssues.push(
          `${label}: paid amount exceeds due amount by ${(paidAmount - dueAmount).toFixed(2)}.`,
        );
      }

      if (installment.status === "PAID" && metrics.outstandingAmount > 0) {
        installmentIssues.push(
          `${label}: status is PAID but ${metrics.outstandingAmount.toFixed(2)} remains outstanding.`,
        );
      }

      if (installment.status === "PENDING" && paidAmount > 0) {
        installmentIssues.push(
          `${label}: status is PENDING even though payments are already posted.`,
        );
      }

      if (installment.status === "PARTIALLY_PAID" && paidAmount <= 0) {
        installmentIssues.push(
          `${label}: status is PARTIALLY_PAID without any paid amount.`,
        );
      }

      for (const payment of installment.payments) {
        if (payment.memberId !== installment.chitEnrollment.member.id) {
          installmentIssues.push(
            `${label}: payment ${payment.id} is linked to a different member than the installment owner.`,
          );
        }

        if (payment.chitGroupId !== installment.chitGroup.id) {
          installmentIssues.push(
            `${label}: payment ${payment.id} is linked to a different chit group than the installment.`,
          );
        }

        if (payment.chitEnrollmentId !== installment.chitEnrollment.id) {
          installmentIssues.push(
            `${label}: payment ${payment.id} is linked to a different enrollment than the installment.`,
          );
        }
      }
    }

    const auctionIssues: string[] = [];

    for (const cycle of settledAuctions) {
      const label = `${cycle.chitGroup.code} cycle ${cycle.cycleNumber}`;

      if (!cycle.winningEnrollment) {
        auctionIssues.push(`${label}: winning enrollment is missing.`);
        continue;
      }

      const winningBid = cycle.bids.find(
        (bid) => bid.chitEnrollmentId === cycle.winningEnrollmentId,
      );

      if (!winningBid) {
        auctionIssues.push(`${label}: winning bid is missing for the recorded winner.`);
        continue;
      }

      if (!cycle.payout) {
        auctionIssues.push(`${label}: finalized cycle has no payout record.`);
        continue;
      }

      const expected = calculateAuctionPrize(
        toNumber(cycle.chitGroup.prizeAmount),
        toNumber(winningBid.amount),
        cycle.chitGroup.ticketCount,
      );

      const grossPrizeAmount = toNumber(cycle.grossPrizeAmount ?? 0);
      const discountAmount = toNumber(cycle.discountAmount ?? 0);
      const netPrizeAmount = toNumber(cycle.netPrizeAmount ?? 0);
      const dividendAmount = toNumber(cycle.dividendAmount ?? 0);

      if (!moneyMatches(grossPrizeAmount, expected.grossPrizeAmount)) {
        auctionIssues.push(
          `${label}: gross prize ${grossPrizeAmount.toFixed(2)} differs from expected ${expected.grossPrizeAmount.toFixed(2)}.`,
        );
      }

      if (!moneyMatches(discountAmount, expected.discountAmount)) {
        auctionIssues.push(
          `${label}: discount ${discountAmount.toFixed(2)} differs from expected ${expected.discountAmount.toFixed(2)}.`,
        );
      }

      if (!moneyMatches(netPrizeAmount, expected.netPrizeAmount)) {
        auctionIssues.push(
          `${label}: net prize ${netPrizeAmount.toFixed(2)} differs from expected ${expected.netPrizeAmount.toFixed(2)}.`,
        );
      }

      if (!moneyMatches(dividendAmount, expected.dividendAmount)) {
        auctionIssues.push(
          `${label}: dividend ${dividendAmount.toFixed(2)} differs from expected ${expected.dividendAmount.toFixed(2)}.`,
        );
      }

      if (!moneyMatches(toNumber(cycle.payout.netAmount), expected.netPrizeAmount)) {
        auctionIssues.push(
          `${label}: payout net amount does not match the finalized net prize.`,
        );
      }

      if (cycle.payout.memberId !== cycle.winningEnrollment.member.id) {
        auctionIssues.push(
          `${label}: payout member does not match the auction winner.`,
        );
      }

      if (cycle.payout.chitEnrollmentId !== cycle.winningEnrollment.id) {
        auctionIssues.push(
          `${label}: payout enrollment does not match the winning ticket.`,
        );
      }
    }

    const payoutIssues: string[] = [];

    for (const payout of payouts) {
      const label = `${payout.chitGroup.code} cycle ${payout.auctionCycle.cycleNumber} | ${payout.member.memberCode}`;

      if (payout.status === "PENDING") {
        if (
          payout.approvedAt ||
          payout.paidAt ||
          payout.rejectedAt ||
          payout.rejectionReason ||
          payout.method
        ) {
          payoutIssues.push(
            `${label}: pending payout already contains approval, payment, rejection, or method data.`,
          );
        }
      }

      if (payout.status === "APPROVED") {
        if (!payout.approvedAt) {
          payoutIssues.push(`${label}: approved payout is missing approvedAt.`);
        }

        if (payout.paidAt || payout.rejectedAt || payout.rejectionReason) {
          payoutIssues.push(
            `${label}: approved payout contains paid/rejected fields that should still be empty.`,
          );
        }
      }

      if (payout.status === "PAID" || payout.status === "DISBURSED") {
        if (!payout.approvedAt) {
          payoutIssues.push(`${label}: paid payout is missing approvedAt.`);
        }

        if (!payout.paidAt) {
          payoutIssues.push(`${label}: paid payout is missing paidAt.`);
        }

        if (!payout.method) {
          payoutIssues.push(`${label}: paid payout is missing method.`);
        }

        if (
          payoutMethodRequiresReference(payout.method) &&
          !payout.referenceNo
        ) {
          payoutIssues.push(
            `${label}: paid payout method ${payout.method} requires a reference number.`,
          );
        }
      }

      if (payout.status === "REJECTED") {
        if (!payout.rejectedAt) {
          payoutIssues.push(`${label}: rejected payout is missing rejectedAt.`);
        }

        if (!payout.rejectionReason) {
          payoutIssues.push(`${label}: rejected payout is missing rejection reason.`);
        }

        if (payout.paidAt) {
          payoutIssues.push(`${label}: rejected payout should not have paidAt.`);
        }
      }

      if (payout.status === "CANCELLED") {
        payoutIssues.push(
          `${label}: cancelled payout exists but cancellation is not yet managed in the pilot UI.`,
        );
      }
    }

    const [auditLogs, payments, settledCycleRows, payoutRows] = auditSnapshot;
    const auditIndex = new Map<string, Set<string>>();

    for (const auditLog of auditLogs) {
      const set = auditIndex.get(auditLog.action) ?? new Set<string>();
      set.add(auditLog.entityId);
      auditIndex.set(auditLog.action, set);
    }

    const missingPaymentAudits = payments
      .filter((payment) => !auditIndex.get("payment.recorded")?.has(payment.id))
      .map((payment) => payment.id);
    const missingAuctionAudits = settledCycleRows
      .filter((cycle) => !auditIndex.get("auction-cycle.finalized")?.has(cycle.id))
      .map((cycle) => cycle.id);
    const missingPayoutCreateAudits = payoutRows
      .filter((payout) => !auditIndex.get("payout.created")?.has(payout.id))
      .map((payout) => payout.id);
    const missingPayoutStatusAudits = payoutRows
      .filter(
        (payout) =>
          payout.status !== "PENDING" &&
          !auditIndex.get("payout.status-updated")?.has(payout.id),
      )
      .map((payout) => payout.id);

    const auditIssues: string[] = [];

    if (missingPaymentAudits.length > 0) {
      auditIssues.push(
        `${missingPaymentAudits.length} payment record(s) are missing payment.recorded audit entries.`,
      );
    }

    if (missingAuctionAudits.length > 0) {
      auditIssues.push(
        `${missingAuctionAudits.length} finalized auction cycle(s) are missing auction-cycle.finalized audit entries.`,
      );
    }

    if (missingPayoutCreateAudits.length > 0) {
      auditIssues.push(
        `${missingPayoutCreateAudits.length} payout record(s) are missing payout.created audit entries.`,
      );
    }

    if (missingPayoutStatusAudits.length > 0) {
      auditIssues.push(
        `${missingPayoutStatusAudits.length} non-pending payout(s) are missing payout.status-updated audit entries.`,
      );
    }

    const paymentReferenceMap = new Map<string, number>();
    const payoutReferenceMap = new Map<string, number>();

    for (const installment of installments) {
      for (const payment of installment.payments) {
        const referenceNo = payment.referenceNo?.trim().toUpperCase();

        if (!referenceNo) {
          continue;
        }

        const key = `${payment.chitGroupId}:${referenceNo}`;
        paymentReferenceMap.set(key, (paymentReferenceMap.get(key) ?? 0) + 1);
      }
    }

    for (const payout of payouts) {
      const referenceNo = payout.referenceNo?.trim().toUpperCase();

      if (!referenceNo) {
        continue;
      }

      const key = `${payout.chitGroup.id}:${referenceNo}`;
      payoutReferenceMap.set(key, (payoutReferenceMap.get(key) ?? 0) + 1);
    }

    const duplicateReferenceIssues = [
      ...Array.from(paymentReferenceMap.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => `Payment reference ${key} appears ${count} times.`),
      ...Array.from(payoutReferenceMap.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => `Payout reference ${key} appears ${count} times.`),
    ];

    const [notificationCount, unreadNotificationCount, deliveryCount, failedDeliveryCount, failedDeliveries] =
      notificationSnapshot;

    const demoWelcomeWarnings = demoAccounts
      .filter((account) => !account.hasWelcomeNotification)
      .map((account) => `${account.email} is missing the seeded welcome notification.`);

    const notificationChecks: PilotReadinessCheck[] = [
      {
        key: "notification-seed",
        label: "Demo notification seed coverage",
        status: demoWelcomeWarnings.length > 0 ? "warn" : "pass",
        detail:
          demoWelcomeWarnings.length > 0
            ? `${demoWelcomeWarnings.length} demo account(s) are missing their welcome notification.`
            : "All seeded demo accounts have welcome notifications.",
        items: demoWelcomeWarnings.slice(0, 6),
      },
      {
        key: "delivery-health",
        label: "Notification delivery log health",
        status: failedDeliveryCount > 0 ? "warn" : "pass",
        detail:
          failedDeliveryCount > 0
            ? `${failedDeliveryCount} failed delivery attempt(s) found out of ${deliveryCount} logged deliveries.`
            : `${deliveryCount} delivery attempt(s) logged with no failures.`,
        items: failedDeliveries.slice(0, 6).map((delivery) => {
          return `${delivery.notification.user.email} | ${delivery.notification.title} | ${delivery.errorMessage ?? "Failed without error text"}`;
        }),
      },
      {
        key: "notification-volume",
        label: "In-app notification history present",
        status: notificationCount === 0 ? "warn" : "pass",
        detail:
          notificationCount === 0
            ? "No notifications exist yet. Generate reminders before pilot walkthroughs."
            : `${notificationCount} notifications stored with ${unreadNotificationCount} still unread.`,
      },
    ];

    const dataIntegrityChecks: PilotReadinessCheck[] = [
      {
        key: "installment-balances",
        label: "Installment and payment balance integrity",
        status: installmentIssues.length > 0 ? "fail" : "pass",
        detail:
          installmentIssues.length > 0
            ? `${installmentIssues.length} installment integrity issue(s) found.`
            : "Installment paid amounts, receipts, and collection links are internally consistent.",
        items: installmentIssues.slice(0, 8),
      },
      {
        key: "auction-payout-linkage",
        label: "Auction finalization creates correct payout",
        status: auctionIssues.length > 0 ? "fail" : "pass",
        detail:
          auctionIssues.length > 0
            ? `${auctionIssues.length} finalized auction or payout linkage issue(s) found.`
            : "Finalized auctions have matching winners, prize calculations, and payout records.",
        items: auctionIssues.slice(0, 8),
      },
      {
        key: "payout-transition-validity",
        label: "Payout transitions remain valid",
        status: payoutIssues.length > 0 ? "fail" : "pass",
        detail:
          payoutIssues.length > 0
            ? `${payoutIssues.length} payout transition issue(s) found.`
            : "Payout state data matches the current approval and payment workflow.",
        items: payoutIssues.slice(0, 8),
      },
      {
        key: "audit-coverage",
        label: "Critical audit logs exist",
        status: auditIssues.length > 0 ? "fail" : "pass",
        detail:
          auditIssues.length > 0
            ? `${auditIssues.length} audit coverage gap(s) found.`
            : "Payments, auction finalizations, payout creation, and payout status changes all have audit coverage.",
        items: auditIssues.slice(0, 8),
      },
      {
        key: "duplicate-protection",
        label: "Duplicate reference protection holds",
        status: duplicateReferenceIssues.length > 0 ? "fail" : "pass",
        detail:
          duplicateReferenceIssues.length > 0
            ? `${duplicateReferenceIssues.length} duplicate reference issue(s) found.`
            : "No duplicate payment or payout references were found inside the same chit group.",
        items: duplicateReferenceIssues.slice(0, 8),
      },
    ];

    const manualQaTargets: PilotManualCheck[] = [
      {
        label: "Login and role landing flows",
        href: "/login",
        note: "Verify all four demo accounts land on the correct workspace after sign-in.",
      },
      {
        label: "Member self-only access",
        href: "/dashboard",
        note: "Sign in as the member demo account, open the linked member summary, and confirm no other member record is reachable.",
      },
      {
        label: "Collections mobile flow",
        href: "/collections",
        note: "Verify installment selection, sticky submit, and recent receipts on a narrow viewport.",
      },
      {
        label: "Auction finalization and payout flow",
        href: "/auctions",
        note: "Confirm bid entry, finalization confirmation, payout transition confirmation, and resulting notifications.",
      },
      {
        label: "Reports and export print views",
        href: "/reports",
        note: "Open all export-safe views and verify print rendering plus filter handling.",
      },
      {
        label: "Notification center and delivery log",
        href: "/notifications",
        note: "Generate reminders and review in-app notifications plus the delivery log.",
      },
    ];

    const automatedStatuses = [
      ...environmentChecks.map((check) => check.status),
      ...demoAccounts.map((account) => account.status),
      ...notificationChecks.map((check) => check.status),
      ...dataIntegrityChecks.map((check) => check.status),
    ];

    const failures = automatedStatuses.filter((status) => status === "fail").length;
    const warnings = automatedStatuses.filter((status) => status === "warn").length;
    const passes = automatedStatuses.filter((status) => status === "pass").length;
    const overallStatus: PilotReadinessStatus =
      failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass";

    const unresolvedIssues = [
      ...environmentChecks.filter((check) => check.status !== "pass"),
      ...demoAccounts.filter((account) => account.status !== "pass"),
      ...notificationChecks.filter((check) => check.status !== "pass"),
      ...dataIntegrityChecks.filter((check) => check.status !== "pass"),
    ].map((check) => `${check.label}: ${check.detail}`);

    const mustFixBeforePilot = [
      ...environmentChecks.filter((check) => check.status === "fail"),
      ...demoAccounts.filter((account) => account.status === "fail"),
      ...dataIntegrityChecks.filter((check) => check.status === "fail"),
    ].map((check) => `${check.label}: ${check.detail}`);

    const safeForPilot = [
      "Proxy-based route protection is present for dashboard, members, chit funds, collections, auctions, reports, notifications, and exports.",
      "Action-level permission guards continue to protect payment recording, chit group creation, enrollments, auctions, payouts, reports, exports, and reminder generation.",
      "Member detail access still enforces self-only behavior for the MEMBER role.",
      "Reports and export-safe operational views remain available without changing the underlying module architecture.",
    ];

    const postPilotRoadmap = [
      "Automate these readiness checks with integration tests and seeded smoke tests.",
      "Replace the in-app-only notification provider with real WhatsApp/SMS/email adapters.",
      "Add payout proof file storage and attachment upload instead of a placeholder URL.",
      "Expand destructive-action confirmations into richer review drawers and approval trails.",
    ];

    return {
      summary: {
        passes,
        warnings,
        failures,
        overallStatus,
      },
      environmentChecks,
      demoAccounts,
      protectedRoutes: protectedRouteDefinitions,
      permissionMatrix: permissionEntries().map(([permission, guard]) => ({
        permission,
        label: guard.label,
        description: guard.description,
        allowedRoles: guard.allowedRoles,
      })),
      notificationChecks,
      dataIntegrityChecks,
      manualQaTargets,
      unresolvedIssues,
      mustFixBeforePilot,
      safeForPilot,
      postPilotRoadmap,
    };
  },
};

export function describePilotReadinessError(error: unknown): PilotReadinessErrorSummary {
  const message = error instanceof Error ? error.message : "Unknown pilot readiness error.";
  const hasFallbackAuthSecret = env.AUTH_SECRET === fallbackAuthSecret;

  if (
    message.includes("P1001") ||
    message.includes("Can't reach database server")
  ) {
    return {
      title: "Pilot database is unreachable",
      description:
        "The readiness report could not query the database configured by DATABASE_URL, so live balance, payout, notification, and audit checks could not run.",
      nextSteps: [
        "Start the database server referenced by DATABASE_URL and confirm it is reachable from this app environment.",
        hasFallbackAuthSecret
          ? "Set a real AUTH_SECRET in .env before pilot sign-off."
          : "Re-open /reports/pilot after the database is reachable.",
        "Re-run the pilot checklist once /reports/pilot loads successfully.",
      ],
    };
  }

  if (hasFallbackAuthSecret) {
    return {
      title: "Pilot readiness is blocked by configuration",
      description:
        "The readiness report failed and the app is also still using the development fallback AUTH_SECRET.",
      nextSteps: [
        "Set a real AUTH_SECRET in .env.",
        "Resolve the reported readiness error and reload /reports/pilot.",
        "Re-run lint, build, and the final pilot verification checklist.",
      ],
    };
  }

  return {
    title: "Pilot readiness could not be loaded",
    description:
      "The readiness report failed before it could complete the live pilot checks.",
    nextSteps: [
      "Review the current error text for the failing subsystem.",
      "Restore database connectivity and environment configuration as needed.",
      "Reload /reports/pilot and confirm the live checks complete.",
    ],
  };
}
