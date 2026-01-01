import { prisma } from "~/server/utils/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const resendSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email } = resendSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists
    if (!user) {
      return {
        success: true,
        message: "If an account exists, a new verification code has been sent"
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      throw createError({
        statusCode: 400,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const emailVerifyToken = uuidv4();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken },
    });

    const config = useRuntimeConfig();
    const verificationUrl = `${config.public.appUrl}/auth/verify-email?token=${emailVerifyToken}`;

    // Send verification email
    // await sendMail({
    //   to: email,
    //   subject: "Verify your email address",
    //   html: `
    //     <h1>Email Verification</h1>
    //     <p>Hello ${user.name || "there"},</p>
    //     <p>Please click the link below to verify your email address:</p>
    //     <p><a href="${verificationUrl}">Verify Email</a></p>
    //     <p>If you did not create an account, please ignore this email.</p>
    //   `,
    // });

    return {
      success: true,
      url: verificationUrl, // For demo purposes
      message: "Verification code has been resent"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: "Invalid input",
        data: error.errors,
      });
    }

    console.error("Resend verification error:", error);

    // If error is already a Nuxt error, rethrow it
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "An error occurred while resending verification",
    });
  }
});