'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { chitGroupsService } from "@/modules/chit-funds/chit-groups.service";
import {
  createChitGroupSchema,
  createEnrollmentSchema,
} from "@/modules/chit-funds/chit-groups.validation";

const chitFundsPath = "/chit-funds";

export async function createChitGroupAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "create_chit_group",
    chitFundsPath,
  );
  const parsed = createChitGroupSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        chitFundsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to create the chit group.",
      ),
    );
  }

  try {
    await chitGroupsService.createChitGroup(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        chitFundsPath,
        "error",
        error instanceof Error
          ? error.message
          : "Unable to create the chit group.",
      ),
    );
  }

  revalidatePath(chitFundsPath);
  redirect(
    buildFeedbackHref(
      chitFundsPath,
      "success",
      "Chit group created successfully.",
    ),
  );
}

export async function enrollMemberInChitGroupAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "enroll_member",
    chitFundsPath,
  );
  const parsed = createEnrollmentSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        chitFundsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to enroll the member.",
      ),
    );
  }

  try {
    await chitGroupsService.enrollMember(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        chitFundsPath,
        "error",
        error instanceof Error ? error.message : "Unable to enroll the member.",
      ),
    );
  }

  revalidatePath(chitFundsPath);
  revalidatePath("/collections");
  redirect(
    buildFeedbackHref(
      chitFundsPath,
      "success",
      "Member enrolled into the chit group successfully.",
    ),
  );
}
