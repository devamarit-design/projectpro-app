"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedExpenseData {
    merchant: string;
    date: string;
    total: number;
    items: {
        description: string;
        amount: number;
        category: string;
    }[];
}

export type AnalyzeReceiptResult =
    | { success: true; data: ExtractedExpenseData }
    | { success: false; error: string };

export async function analyzeReceipt(base64Image: string): Promise<AnalyzeReceiptResult> {
    if (!apiKey) {
        console.error("Missing Gemini API Key");
        return { success: false, error: "Missing API Key configuration. Please check Vercel settings." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Remove header if present (server-side clean up if passed full data URL)
        const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

        const prompt = `
        Analyze this image (Receipt, Tax Invoice, or Bank Transfer Slip) and extract the following information in JSON format:

        **Context**: This is for a Thai construction expense tracking app. The image might be:
        1. A **Receipt/Tax Invoice** (ใบเสร็จรับเงิน/ใบกำกับภาษี): Look for "Merchant/Seller Name" and "Items".
        2. A **Bank Transfer Slip** (สลิปโอนเงิน): Look for "Receiver Name" (to account) as Merchant. "Amount" is the Total.

        **Fields to Extract**:
        - **merchant**: The name of the store, biller, or receiver (User "Mr." or "Company" name if visible).
            - Keywords to look for: "ผู้รับเงิน", "บริษัท", "ร้าน", "To", "Received By".
        - **date**: The transaction date in YYYY-MM-DD format. (Convert BE 2567 -> 2024, 2568 -> 2025).
        - **total**: The Grand Total amount paid (Net Amount).
            - Keywords: "ยอดรวม", "ยอดสุทธิ", "จำนวนเงิน", "Amount", "Total".
        - **items**: An array of items purchased.
            - If it's a Transfer Slip with no item list, create **ONE** item with description "Transfer to [Merchant]" or "Payment for [Note]".
            - If it's a Receipt, list the actual items.
            - **description**: Product name or brief description (Thai or English).
            - **amount**: Price of that specific item.
            - **category**: EXACTLY ONE OF: ['Material', 'Labor', 'Sub-contract', 'Equipment', 'Fuel', 'Other'].
                - 'Material': Concrete, Steel, Wood, Paint, Hardware, Supplies.
                - 'Labor': Wages, Salary, Daily pay.
                - 'Fuels': Gas, Petrol, Diesel.
                - 'Equipment': Tools, Machines rental.

        **Important**: 
        - Return ONLY raw JSON. No Markdown.
        - Handle Thai numbers or text correctly.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Parse JSON
        const data = JSON.parse(jsonStr) as ExtractedExpenseData;
        console.log("Server-Side AI Analysis Complete");

        return { success: true, data };

    } catch (error: any) {
        console.error("Server-Side AI Service Error:", error);
        return { success: false, error: error.message || "Failed to analyze receipt" };
    }
}
