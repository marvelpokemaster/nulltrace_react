import { NextResponse } from "next/server";

// In-memory storage (in production, use a database)
// This will reset on server restart
let opinions: Array<{
  id: string;
  content: string;
  author?: string;
  timestamp: string;
}> = [];

export async function GET() {
  try {
    // Return opinions in reverse chronological order (newest first)
    return NextResponse.json({ 
      success: true, 
      opinions: [...opinions].reverse() 
    });
  } catch (error) {
    console.error("Error fetching opinions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch opinions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { content, author } = data;

    // Validate input
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Opinion content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Opinion content cannot be empty" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Opinion content must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // Create new opinion
    const newOpinion = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content: content.trim(),
      author: author?.trim() || "Anonymous",
      timestamp: new Date().toISOString(),
    };

    opinions.push(newOpinion);

    return NextResponse.json({ 
      success: true, 
      opinion: newOpinion 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating opinion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create opinion" },
      { status: 500 }
    );
  }
}

