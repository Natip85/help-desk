import type { ClientUploadedFileData } from "uploadthing/types";
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Type for product image uploads
export type ProductImageUploadResponse = ClientUploadedFileData<{
  uploadedBy: string;
  imageId: string;
  url: string;
  key: string;
  position: number;
}>[];

// Type for generic image uploads
export type ImageUploadResponse = ClientUploadedFileData<{
  uploadedBy: string;
  url: string;
  key: string;
}>[];

// Type for profile image uploads
export type ProfileImageUploadResponse = ClientUploadedFileData<{
  uploadedBy: string;
  url: string;
  key: string;
}>[];
