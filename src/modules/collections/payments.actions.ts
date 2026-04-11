'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { paymentsService } from "@/modules/collections/payments.service";
import { recordInstallmentPaymentSchema } from "@/modules/collections/payments.validation";

const collectionsPath = "/collections";

export async function recordInstallmentPaymentAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "record_payment",
    collectionsPath,
  );
  const parsed = recordInstallmentPaymentSchema.safeParse(
    formDataToObject(formData),
  );

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        collectionsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to record the payment.",
      ),
    );
  }

  try {
    await paymentsService.recordInstallmentPayment(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        collectionsPath,
        "error",
        error instanceof Error ? error.message : "Unable to record the payment.",
      ),
    );
  }

  revalidatePath(collectionsPath);
  revalidatePath("/dashboard");
  revalidatePath("/chit-funds");
  revalidatePath("/members");
  revalidatePath("/reports");
  revalidatePath("/reports/pilot");
  revalidatePath("/exports");
  redirect(
    buildFeedbackHref(
      collectionsPath,
      "success",
      "Installment payment recorded successfully.",
    ),
  );
}
