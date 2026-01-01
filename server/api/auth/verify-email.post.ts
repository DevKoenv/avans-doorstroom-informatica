import { prisma } from "~/server/utils/prisma";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { token } = verifySchema.parse(body);

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw createError({
        statusCode: 400,
        message: "Invalid or expired verification token",
      });
    }

    if (user.emailVerified) {
      throw createError({
        statusCode: 400,
        message: "Email is already verified",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: "Invalid input",
        data: error.errors,
      });
    }

    console.error("Email verification error:", error);

    // If error is already a Nuxt error, rethrow it
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "An error occurred during verification",
    });
  }
});
