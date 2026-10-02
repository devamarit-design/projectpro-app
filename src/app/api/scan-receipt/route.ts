import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authErrorResponse, requireOrganizationAccess } from "@/lib/api-auth";

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

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image, orgId } = body;
        await requireOrganizationAccess(req, orgId);

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        if (!image) {
            return NextResponse.json(
                { error: "No image data provided" },
                { status: 400 }
            );
        }

        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];

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
                - 'Fuel': Gas, Petrol, Diesel.
                - 'Equipment': Tools, Machines rental.

        **Important**: 
        - Return ONLY raw JSON. No Markdown.
        - Handle Thai numbers or text correctly.
        - Double-check Thai spelling for accuracy.
        `;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.95,
                        topK: 64,
                        maxOutputTokens: 8192,
                    }
                });

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
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

                const data = JSON.parse(jsonStr) as ExtractedExpenseData;
                return NextResponse.json({ success: true, data });
            } catch (err: any) {
                const isRetryable = err?.message?.includes("429") || err?.message?.includes("404") || err?.status === 429 || err?.status === 404;
                if (isRetryable && modelName !== MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
                    console.warn(`Model ${modelName} failed, trying next...`);
                    continue;
                }
                console.error(`AI Model ${modelName} error:`, err);
                return NextResponse.json({ success: false, error: err.message || "Failed to parse receipt" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: false, error: "All AI models are currently unavailable." }, { status: 500 });

    } catch (error: any) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        console.error("Scan Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to scan receipt" },
            { status: 500 }
        );
    }
}
