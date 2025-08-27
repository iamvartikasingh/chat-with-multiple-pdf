// src/lib/config.ts
import "dotenv/config";                // <-- loads .env for tsx/Node scripts
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1),
  PINECONE_API_KEY: z.string().trim().min(1),

  // Keep ENVIRONMENT for backwards compat, but prefer REGION with v5
  PINECONE_ENVIRONMENT: z.string().trim().min(1).optional(),
  PINECONE_REGION: z.string().trim().min(1).optional(),

  PINECONE_INDEX_NAME: z.string().trim().min(1),
  PINECONE_NAME_SPACE: z.string().trim().min(1).default("default"),

  PDF_PATH: z.string().trim().min(1),
  INDEX_INIT_TIMEOUT: z.coerce.number().min(1).default(240000),
});

export const env = EnvSchema.parse(process.env);

// Normalize region: prefer PINECONE_REGION; else derive from ENVIRONMENT
export const pineconeRegion =
  env.PINECONE_REGION ??
  (env.PINECONE_ENVIRONMENT
    ? env.PINECONE_ENVIRONMENT.split("-").slice(0, 2).join("-") // "us-east1-gcp-free" -> "us-east1"
    : "us-west4");