import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { db } from "@/db";
import { users, videos } from "@/db/schema";

const f = createUploadthing();


export const ourFileRouter = {
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({
      videoId: z.string().uuid()
    }))
    .middleware(async ({ input }) => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerId, clerkUserId))

      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      return { user, ...input };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      await db
        .update(videos)
        .set({
          thumbnailUrl: file.url
        })
        .where(and(
          eq(videos.id, metadata.videoId),
          eq(videos.userId, metadata.user.id),
        ))

      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
