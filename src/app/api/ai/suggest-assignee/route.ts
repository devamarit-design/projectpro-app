
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { authErrorResponse, requireOrganizationAccess } from "@/lib/api-auth";

export async function POST(req: Request) {
    try {
        const { taskTitle, taskDescription, teamMembers, projectContext, orgId } = await req.json();
        await requireOrganizationAccess(req, orgId);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an AI Project Manager Assistant.
      
      Task: "${taskTitle}"
      Description: "${taskDescription || "No description provided."}"
      Project Context: "${projectContext || "General Construction Project"}"
      
      Team Members (Candidates):
      ${JSON.stringify(teamMembers.map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            skills: m.skills || []
        })), null, 2)}
      
      Your Goal: Select the ONE best assignee for this task based on their role and skills.
      
      Response Format (JSON only):
      {
        "assigneeId": "string (id of selected user)",
        "reason": "string (short explanation in Thai, max 1 sentence)"
      }
    `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const responseText = result.response.text();
        const suggestion = JSON.parse(responseText);

        return NextResponse.json(suggestion);
    } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        console.error("AI Suggestion Error:", error);
        return NextResponse.json(
            { error: "Failed to generate suggestion" },
            { status: 500 }
        );
    }
}
