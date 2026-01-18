import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
// Note: In a production environment, it is recommended to use a proxy backend to hide the API Key,
// but for a PWA/Static App without a backend, using NEXT_PUBLIC_ is the only way.
// Ensure you restrict the API Key in Google Cloud Console to your specific domain.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

export interface ExtractedExpenseData {
    merchant: string
    date: string
    total: number
    items: {
        description: string
        amount: number
        category: string
    }[]
}

export async function analyzeReceipt(base64Image: string): Promise<ExtractedExpenseData> {
    if (!apiKey) {
        throw new Error("Missing API Key. Please configure NEXT_PUBLIC_GEMINI_API_KEY.")
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Remove header if present (data:image/jpeg;base64,) to get raw base64
        const base64Data = base64Image.includes(',')
            ? base64Image.split(',')[1]
            : base64Image

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
        `

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ])

        const response = await result.response
        const text = response.text()

        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const data = JSON.parse(jsonStr) as ExtractedExpenseData
        console.log("Gemini Client-Side Extracted:", data)
        return data

    } catch (error: any) {
        console.error("AI Service Error:", error)
        throw new Error(error.message || "Failed to analyze receipt")
    }
}
