import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  SchemaType,
  Content,
  Part,
  FunctionResponsePart,
} from "@google/generative-ai";
import { getUser, saveUserMemory } from "./storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `You are Guardia, a trusted consumer safety agent. Your job is to help users understand what's in the food and health products they're buying — and protect them from unsafe, fake, or misleading products.

When a user shares a product image or asks about a product:
1. Identify the brand name and product name
2. Check the user's health profile for any relevant allergies or conditions
3. If critical health data is missing and the product category warrants it (supplements, allergens, medications), call ask_user_question to get it — then call format_response with the question as the reply
4. Otherwise, call validate_brand to look up the brand's safety record
5. Call format_response with your verdict and the validation result

You have these tools:
- get_user_profile: fetch the user's current stored health profile mid-conversation
- ask_user_question: proactively ask the user for missing health info before giving a verdict
- save_user_memory: persist a fact you learn about the user (allergy, condition, preference)
- validate_brand: look up brand legitimacy, certifications, FDA warnings, reviews
- format_response: ALWAYS call this last — it is the only way to return your reply

Rules:
- Never fabricate certifications or safety data
- If you ask a question, set validation_result to null in format_response
- If you give a verdict, always call validate_brand first, then format_response with the result
- Be direct and proactive — don't wait for the user to ask "is this safe?"`;

function buildSystemWithProfile(profile: Record<string, unknown>): string {
  const parts: string[] = [];

  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.blood_type) parts.push(`Blood type: ${profile.blood_type}`);

  const history = profile.medical_history;
  if (Array.isArray(history) && history.length > 0)
    parts.push(`Medical history / conditions: ${history.join(", ")}`);

  const meds = profile.current_medications;
  if (Array.isArray(meds) && meds.length > 0)
    parts.push(`Current medications: ${meds.join(", ")}`);

  // Ad-hoc memory keys the agent saved in prior turns
  const knownKeys = new Set([
    "id", "name", "age", "height", "weight", "blood_type",
    "medical_history", "current_medications", "insurance", "onboarded",
  ]);
  for (const [k, v] of Object.entries(profile)) {
    if (!knownKeys.has(k) && v !== undefined && v !== null)
      parts.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  }

  if (parts.length === 0) return BASE_SYSTEM_PROMPT;
  return BASE_SYSTEM_PROMPT + "\n\n--- User Health Profile ---\n" + parts.join("\n");
}

// ---------------------------------------------------------------------------
// Tool declarations (Google SDK format)
// ---------------------------------------------------------------------------

const tools: FunctionDeclaration[] = [
  {
    name: "get_user_profile",
    description:
      "Fetch the user's current stored health profile. Use mid-conversation to double-check allergies or conditions before making a safety recommendation.",
    parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
  },
  {
    name: "ask_user_question",
    description:
      "Ask the user a clarifying health question before giving a verdict. Use when the product category requires knowing something about the user that isn't in their profile yet. After calling this, call format_response with the question as the reply and validation_result as null.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING, description: "The question to ask the user" },
        reason: { type: SchemaType.STRING, description: "Why you need this info" },
      },
      required: ["question"],
    },
  },
  {
    name: "save_user_memory",
    description:
      "Persist a fact learned about the user mid-conversation (e.g. a new allergy, condition, or preference). Saved for future sessions.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        key: { type: SchemaType.STRING, description: "snake_case key e.g. 'latex_allergy'" },
        value: { type: SchemaType.STRING, description: "The value to store" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "validate_brand",
    description:
      "Look up a brand's legitimacy, certifications, user reviews, FDA warnings, and safety record.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        brand_name: { type: SchemaType.STRING, description: "The brand name to look up" },
        product_name: { type: SchemaType.STRING, description: "Specific product name (optional)" },
        product_category: { type: SchemaType.STRING, description: "e.g. supplement, food, cosmetic, medication" },
      },
      required: ["brand_name"],
    },
  },
  {
    name: "format_response",
    description:
      "ALWAYS call this as your final step to return your reply. If you asked a clarifying question, omit validation_result. If you gave a verdict, include the validation result from validate_brand.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reply: { type: SchemaType.STRING, description: "Your message to the user" },
        validation_result: {
          type: SchemaType.OBJECT,
          description: "Result from validate_brand, or omit if asking a question",
          properties: {
            brand_name: { type: SchemaType.STRING },
            product_name: { type: SchemaType.STRING },
            trust_score: { type: SchemaType.NUMBER },
            verdict: { type: SchemaType.STRING },
            certifications: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            red_flags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            reviews_summary: { type: SchemaType.STRING },
          },
        },
      },
      required: ["reply"],
    },
  },
];

// ---------------------------------------------------------------------------
// Stub — teammate replaces with real Tavily + scoring pipeline
// ---------------------------------------------------------------------------
async function stubValidateBrand(
  brandName: string,
  productName = "",
  _productCategory = ""
): Promise<ValidationResult> {
  return {
    brand_name: brandName,
    product_name: productName,
    trust_score: null,
    verdict: "PENDING_VALIDATION",
    certifications: [],
    red_flags: [],
    reviews_summary: "Brand validation in progress — teammate is wiring Tavily here.",
    sources: [],
    stub: true,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  brand_name: string;
  product_name: string;
  trust_score: number | null;
  verdict: string;
  certifications: string[];
  red_flags: string[];
  reviews_summary: string;
  sources: unknown[];
  stub?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  validation: ValidationResult | null;
  askedQuestion: boolean;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runChat(
  message: string,
  conversationHistory: ChatMessage[],
  userProfile: Record<string, unknown>,
  imageBase64?: string,
  imageMediaType?: string
): Promise<ChatResult> {
  const systemInstruction = buildSystemWithProfile(userProfile);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    tools: [{ functionDeclarations: tools }],
    // Force it to use tools (it must call format_response to finish)
    toolConfig: { functionCallingConfig: { mode: "AUTO" as any } },
  });

  // Build history in Gemini Content format (cap at 10 turns)
  const trimmedHistory = conversationHistory.slice(-10);
  const history: Content[] = trimmedHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });

  // Build the first user message parts
  const userParts: Part[] = [];
  if (imageBase64 && imageMediaType) {
    userParts.push({ inlineData: { data: imageBase64, mimeType: imageMediaType } });
  }
  userParts.push({ text: message || "Please analyze this product." });

  let finalReply = "";
  let finalValidation: ValidationResult | null = null;

  // ---------------------------------------------------------------------------
  // Agentic loop
  // ---------------------------------------------------------------------------
  let currentParts: Part[] = userParts;

  while (true) {
    const result = await chat.sendMessage(currentParts);
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) break;

    const responseParts = candidate.content.parts;
    const functionCalls = responseParts.filter((p) => p.functionCall);

    // No tool calls — model returned text directly (fallback)
    if (functionCalls.length === 0) {
      finalReply = response.text();
      break;
    }

    // Dispatch all tool calls, collect results
    const functionResponses: FunctionResponsePart[] = [];
    let shouldBreak = false;

    for (const part of responseParts) {
      if (!part.functionCall) continue;

      const { name, args } = part.functionCall;
      let responseData: unknown;

      switch (name) {
        case "get_user_profile": {
          responseData = await getUser();
          break;
        }
        case "ask_user_question": {
          const a = args as { question: string; reason?: string };
          responseData = { noted: true, question: a.question };
          break;
        }
        case "save_user_memory": {
          const a = args as { key: string; value: string };
          await saveUserMemory(a.key, a.value);
          responseData = { saved: true, key: a.key };
          break;
        }
        case "validate_brand": {
          const a = args as { brand_name: string; product_name?: string; product_category?: string };
          const result = await stubValidateBrand(a.brand_name, a.product_name, a.product_category);
          finalValidation = result;
          responseData = result;
          break;
        }
        case "format_response": {
          const a = args as { reply: string; validation_result?: ValidationResult | null };
          finalReply = a.reply;
          if (a.validation_result !== undefined) finalValidation = a.validation_result ?? null;
          responseData = { ok: true };
          shouldBreak = true;
          break;
        }
        default:
          responseData = { error: `Unknown tool: ${name}` };
      }

      functionResponses.push({
        functionResponse: { name, response: { result: responseData } },
      });
    }

    if (shouldBreak) break;

    // Feed tool results back for next loop iteration
    currentParts = functionResponses;
  }

  return {
    reply: finalReply,
    validation: finalValidation,
    askedQuestion: finalValidation === null,
  };
}
