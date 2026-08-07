import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const receiptSchema = z.object({
  merchant: z
    .string()
    .nullable()
    .describe("Store or restaurant name if visible"),
  currency: z
    .string()
    .default("USD")
    .describe("ISO currency code guessed from symbols or locale"),
  items: z
    .array(
      z.object({
        name: z.string().describe("Line item description"),
        price: z.number().describe("Unit or line price as a positive number"),
        quantity: z
          .number()
          .default(1)
          .describe("Quantity if shown, otherwise 1"),
      }),
    )
    .describe("Purchased line items only — exclude tax, tip, and totals"),
  tax: z
    .number()
    .nullable()
    .describe("Tax amount if printed, else null"),
  tip: z
    .number()
    .nullable()
    .describe("Tip/gratuity if printed, else null"),
  subtotal: z
    .number()
    .nullable()
    .describe("Subtotal before tax/tip if printed, else null"),
});

export type ParsedReceipt = z.infer<typeof receiptSchema>;

export async function parseReceiptImage(params: {
  mediaType: string;
  data: Buffer;
}): Promise<ParsedReceipt> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: receiptSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Extract receipt line items as structured data.",
              "Ignore logos and decorative text.",
              "Prefer numeric totals printed on the receipt when present.",
              "Do not invent items that are not on the receipt.",
              "Exclude payment method lines, change due, and barcode numbers from items.",
            ].join(" "),
          },
          {
            type: "image",
            image: params.data,
            mediaType: params.mediaType as
              | "image/jpeg"
              | "image/png"
              | "image/webp"
              | "image/gif",
          },
        ],
      },
    ],
  });

  return object;
}
