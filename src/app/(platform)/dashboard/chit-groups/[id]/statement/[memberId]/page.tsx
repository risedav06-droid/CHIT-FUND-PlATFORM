export const revalidate = 10;

import { notFound } from "next/navigation";

import { PrintStatementButton } from "@/components/dashboard/print-statement-button";
import { authService } from "@/modules/auth/auth.service";
import { getStatementData } from "@/utils/supabase/db";

type StatementPageProps = {
  params: Promise<{ id: string; memberId: string }>;
};

export default async function StatementPage({ params }: StatementPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id, memberId } = await params;
  const { data } = await getStatementData(id, memberId, session.user.id);

  if (!data?.group || !data.member) {
    notFound();
  }

  const chitGroup = data.group as any;
  const member = data.member as any;
  const payments = [...((data.payments as any[]) ?? [])].sort(
    (a, b) => Number(a.payment_cycles?.cycle_number ?? 0) - Number(b.payment_cycles?.cycle_number ?? 0),
  );

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "40px auto",
        padding: 40,
        fontFamily: "Arial, sans-serif",
        background: "#fff",
      }}
    >
      <PrintStatementButton
        className="no-print"
        style={{
          background: "#1b4332",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "10px 24px",
          cursor: "pointer",
          marginBottom: 32,
        }}
      />

      <div
        style={{
          borderBottom: "3px solid #1b4332",
          paddingBottom: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#1b4332",
            marginBottom: 4,
          }}
        >
          ChitMate
        </div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          Member Payment Statement
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
          padding: 16,
          background: "#f5f3f0",
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>MEMBER</div>
          <div style={{ fontWeight: 700 }}>{member.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{member.phone}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>CHIT GROUP</div>
          <div style={{ fontWeight: 700 }}>{chitGroup.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {chitGroup.duration_months} months · ₹{Number(chitGroup.monthly_amount).toLocaleString("en-IN")}/month
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>START DATE</div>
          <div style={{ fontWeight: 600 }}>
            {new Date(chitGroup.start_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>GENERATED ON</div>
          <div style={{ fontWeight: 600 }}>
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ background: "#1b4332" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontSize: 12 }}>Month</th>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontSize: 12 }}>Due Date</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontSize: 12 }}>Amount Due</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontSize: 12 }}>Amount Paid</th>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontSize: 12 }}>Mode</th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "#fff", fontSize: 12 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={payment.id} style={{ background: index % 2 === 0 ? "#fff" : "#f9f9f9" }}>
              <td style={{ padding: "9px 12px", fontSize: 13 }}>
                Month {payment.payment_cycles?.cycle_number ?? index + 1}
              </td>
              <td style={{ padding: "9px 12px", fontSize: 13, color: "#6b7280" }}>
                {payment.payment_cycles?.due_date
                  ? new Date(payment.payment_cycles.due_date).toLocaleDateString("en-IN")
                  : "—"}
              </td>
              <td style={{ padding: "9px 12px", fontSize: 13, textAlign: "right" }}>
                ₹{Number(payment.amount_due ?? 0).toLocaleString("en-IN")}
              </td>
              <td style={{ padding: "9px 12px", fontSize: 13, textAlign: "right", fontWeight: 600 }}>
                {Number(payment.amount_paid ?? 0) > 0
                  ? `₹${Number(payment.amount_paid ?? 0).toLocaleString("en-IN")}`
                  : "—"}
              </td>
              <td style={{ padding: "9px 12px", fontSize: 13, color: "#6b7280" }}>
                {payment.payment_mode || "—"}
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: payment.status === "paid" ? "#dcfce7" : "#fee2e2",
                    color: payment.status === "paid" ? "#166534" : "#991b1b",
                  }}
                >
                  {payment.status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: 16,
          fontSize: 12,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        Generated by ChitMate · DAV DEV STUDIO · This is an official payment record.
      </div>
    </div>
  );
}
