import { ThinkingLevel } from "@google/genai";
import { env } from "@repo/config";
import type { ParsedQuery, SearchResult } from "@repo/contracts";
import { callGemini } from "../gemini/key-ring.ts";
import { hedge } from "../lib/hedge.ts";

const SYSTEM = `You write a two sentence summary of used-car search results for a shopper in India.
Plain English, no markdown, no bullet points, mention rupees as lakh. Name the strongest one or two options and one honest caveat
(price, age, kilometres or a relaxed filter). Never invent a vehicle that is not in the list. Under 60 words.`;

const line = (result: SearchResult): string => {
  const v = result.vehicle;
  const safety = v.safetyRating === null ? "not rated" : `${v.safetyRating}-star`;
  return `${v.year} ${v.make} ${v.model} ${v.variant}, ${v.fuelType.toLowerCase()} ${v.transmission.toLowerCase()}, ₹${(v.price / 100_000).toFixed(2)} lakh, ${v.kmDriven.toLocaleString("en-IN")} km, ${safety}, ${v.city}`;
};

export async function summarize(
  query: string,
  understood: ParsedQuery,
  results: SearchResult[],
  relaxed: string[],
): Promise<string> {
  const context = results
    .slice(0, 12)
    .map((result, index) => `${index + 1}. ${line(result)}`)
    .join("\n");
  const caveats =
    relaxed.length > 0 ? `\nRelaxed constraints: ${relaxed.join("; ")}` : "";

  const prompt = `Request: ${query}\nUnderstood as: ${understood.notes || understood.semanticQuery}${caveats}\n\nResults:\n${context}`;

  const generate = (model: string) =>
    callGemini(
      `summarising results (${model})`,
      (client) =>
        client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            temperature: 0.3,
          },
        }),
      { waitForCooldown: false },
    );

  const response = await hedge(
    () => generate(env.GENERATION_MODEL),
    () => generate(env.UTILITY_MODEL),
    2_500,
  );

  return (response.text ?? "").trim();
}
