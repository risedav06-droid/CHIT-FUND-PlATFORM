'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { membersService } from "@/modules/members/members.service";
import { createMemberSchema } from "@/modules/members/members.validation";

const membersPath = "/members";

export async function createMemberAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "create_member",
    membersPath,
  );
  const parsed = createMemberSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        membersPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to create the member.",
      ),
    );
  }

  try {
    await membersService.createMember(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        membersPath,
        "error",
        error instanceof Error ? error.message : "Unable to create the member.",
      ),
    );
  }

  revalidatePath(membersPath);
  redirect(buildFeedbackHref(membersPath, "success", "Member created successfully."));
}
