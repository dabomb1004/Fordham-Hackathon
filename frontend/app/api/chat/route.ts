import { NextResponse } from "next/server";
import { runChat, ChatMessage } from "@/lib/chatAgent";
import { getUser } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const message = (formData.get("message") as string) ?? "";
    const historyRaw = (formData.get("history") as string) ?? "[]";
    const imageFile = formData.get("image") as File | null;

    const history: ChatMessage[] = JSON.parse(historyRaw);

    let imageBase64: string | undefined;
    let imageMediaType: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      imageMediaType = imageFile.type || "image/jpeg";
    }

    if (!message && !imageBase64) {
      return NextResponse.json(
        { error: "Provide a message or an image." },
        { status: 400 }
      );
    }

    const userProfile = await getUser();
    const result = await runChat(message, history, userProfile, imageBase64, imageMediaType);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
