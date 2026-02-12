import type { FileRouter } from "uploadthing/next";
import { headers } from "next/headers";
import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { auth } from "@help-desk/auth";
import { db } from "@help-desk/db";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  /**
   * Product image uploader - for admin product management
   */
  productImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .input(z.object({ productId: z.string().uuid() }))
    .middleware(async ({ input }) => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Unauthorized");
      }

      // Only admins can upload product images
      if (session.user.role !== "admin") {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Admin access required");
      }

      return {
        userId: session.user.id,
        productId: input.productId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // eslint-disable-next-line no-console
      console.log("Product image upload complete:", {
        userId: metadata.userId,
        productId: metadata.productId,
        fileKey: file.key,
      });

      if (!metadata.userId) {
        // eslint-disable-next-line no-console
        console.error("User ID is required", { metadata, file });
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("User ID is required");
      }

      if (!metadata.productId) {
        // eslint-disable-next-line no-console
        console.error("Product ID is required", { metadata, file });
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Product ID is required");
      }

      const insertedImage = await db.query.user.findMany();
      // eslint-disable-next-line no-console
      console.log(insertedImage);
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
      };
    }),

  /**
   * Generic image uploader - for general use
   */
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      // eslint-disable-next-line no-console
      console.log("Image upload complete for userId:", metadata.userId);

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
      };
    }),

  /**
   * Profile image uploader - for user profile pictures
   */
  profileImage: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Unauthorized");
      }

      return {
        userId: session.user.id,
        currentImage: session.user.image,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      // eslint-disable-next-line no-console
      console.log("Profile image upload complete for userId:", metadata.userId);

      // TODO: Update user profile image in database
      // TODO: Delete old profile image if exists

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
      };
    }),
};

export type OurFileRouter = typeof ourFileRouter;
