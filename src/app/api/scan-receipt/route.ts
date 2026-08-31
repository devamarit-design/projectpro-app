
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authErrorResponse, requireOrganizationAccess } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured in .env.local" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { image, orgId } = body;
        await requireOrganizationAccess(req, orgId);

        if (!image) {
            return NextResponse.json(
                { error: "No image data provided" },
                { status: 400 }
            );
        }

        // Remove header if present (data:image/jpeg;base64,)
        const base64Data = image.split(',')[1] || image;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        - merchant: The name of the store or merchant.
        - date: The date of the transaction in YYYY-MM-DD format. If not found, use today's date.
        - total: The total amount/grand total as a number.
        - items: An array of items purchased. Each item should have:
            - description: Product name or description.
            - amount: The price of the item (number).
            - category: Guess the category (Material, Labor, Sub-contract, Equipment, Other) based on the description. Default to 'Material' if unsure.

        Return ONLY the JSON. Do not include markdown formatting like \`\`\`json.
        Example format:
        {
            "merchant": "Store Name",
            "date": "2024-01-01",
            "total": 100.50,
            "items": [
                { "description": "Item 1", "amount": 50.00, "category": "Material" }
            ]
        }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg", // Assuming JPEG/PNG, Gemini handles both via generic image prompts usually, but correct mime helps. Base64 often comes with it.
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(jsonStr);
            console.log("Gemini Extracted Data:", data);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error: any) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        console.error("Scan Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to scan receipt" },
            { status: 500 }
        );
    }
}
