"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireOrganizationAccess } from "@/lib/api-auth";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedExpenseData {
    merchant: string;
    date: string;
    total: number;
    items: {
        description: string;
        amount: number;
        quantity: number;
        unitPrice: number;
        category: string;
    }[];
}

export type AnalyzeReceiptResult =
    | { success: true; data: ExtractedExpenseData }
    | { success: false; error: string };

export async function analyzeReceipt(base64Image: string, authToken: string, orgId: string): Promise<AnalyzeReceiptResult> {
    try {
        await requireOrganizationAccess(new Request("http://localhost", {
            headers: { Authorization: `Bearer ${authToken}` },
        }), orgId)
    } catch {
        return { success: false, error: "Authentication required. Please sign in again." }
    }

    if (!apiKey) {
        console.error("Missing Gemini API Key");
        return { success: false, error: "Missing API Key configuration. Please check Vercel settings." };
    }

    const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash"];

    // Remove header if present (server-side clean up if passed full data URL)
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    for (const modelName of MODELS_TO_TRY) {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.1, // Low temp for deterministic OCR
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 8192,
            }
        });

        console.log(`Trying model: ${modelName}`);

        const prompt = `
        คุณเป็น AI ที่เชี่ยวชาญในการอ่านใบเสร็จ/บิลภาษาไทย
        You are an expert OCR AI specialized in reading Thai receipts and invoices.
        
        Analyze this image (Receipt, Tax Invoice, or Bank Transfer Slip) and extract the following information in JSON format:

        **Context**: This is for a Thai construction expense tracking app. The image might be:
        1. A **Receipt/Tax Invoice** (ใบเสร็จรับเงิน/ใบกำกับภาษี): Look for "Merchant/Seller Name" and "Items".
        2. A **Bank Transfer Slip** (สลิปโอนเงิน): Look for "Receiver Name" (to account) as Merchant. "Amount" is the Total.

        **CRITICAL Thai Language Instructions**:
        - Read Thai text very carefully, especially product names in construction materials stores.
        - Common Thai store names: ห้าง (store), ร้าน (shop), บริษัท (company).
        - Common Thai product names in construction: ก๊อกน้ำ (faucet), ท่อ (pipe), สายไฟ (wire), ปูน (cement), สี (paint), น็อต (nut/bolt), สว่าน (drill), บอลวาล์ว (ball valve), ฟุตวาล์ว (foot valve), วาล์ว (valve), ข้อต่อ (fitting), เหล็ก (steel), ไม้ (wood).
        - Pay attention to Thai script variations and don't confuse similar characters.
        - If a word is unclear, use context from surrounding text and common construction terminology.

        **Fields to Extract**:
        - **merchant**: The name of the store, biller, or receiver (Use "Mr." or "Company" name if visible).
            - Keywords to look for: "ผู้รับเงิน", "บริษัท", "ร้าน", "ห้าง", "จาก", "To", "Received By".
        - **date**: The transaction date in YYYY-MM-DD format. (Convert BE 2567 -> 2024, 2568 -> 2025, 2569 -> 2026).
        - **total**: The Grand Total amount paid (Net Amount).
            - Keywords: "ยอดรวม", "ยอดสุทธิ", "รวมทั้งสิ้น", "จำนวนเงิน", "Amount", "Total".
        - **items**: An array of items purchased.
            - If it's a Transfer Slip with no item list, create **ONE** item with description "Transfer to [Merchant]" or "Payment for [Note]".
            - If it's a Receipt, list the actual items.
            - **description**: Product name (prefer keeping original Thai if confident, otherwise romanize).
            - **amount**: Total price of this line item (quantity * unitPrice).
            - **quantity**: The quantity of items. 
                - **CRITICAL**: If NO quantity is explicitly visible, YOU MUST RETURN 1.
            - **unitPrice**: The price per unit.
                - If not visible, calculate it as amount / quantity.
            - **category**: EXACTLY ONE OF: ['Material', 'Labor', 'Sub-contract', 'Equipment', 'Fuel', 'Other'].
                - 'Material': Concrete, Steel, Wood, Paint, Hardware, Supplies, Plumbing, Electrical.
                - 'Labor': Wages, Salary, Daily pay.
                - 'Fuels': Gas, Petrol, Diesel.
                - 'Equipment': Tools, Machines rental.

        **Important**: 
        - Return ONLY raw JSON. No Markdown.
        - Handle Thai numbers or text correctly.
        - Double-check Thai spelling for accuracy.
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
        const isRetryable = error?.message?.includes("429") || error?.message?.includes("404") || error?.status === 429 || error?.status === 404;
        if (isRetryable && modelName !== MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
            console.warn(`Model ${modelName} returned 429, trying next model...`);
            continue; // Try next model
        }
        console.error(`AI Service Error (${modelName}):`, error);
        return { success: false, error: error.message || "Failed to analyze receipt" };
    }
    } // end for loop

    return { success: false, error: "All AI models are currently unavailable. Please try again later." };
}
