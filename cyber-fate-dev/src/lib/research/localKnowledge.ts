import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { ResearchNoteSchema, type ResearchNote } from "@/lib/agents/schemas";

const knowledgeDir = path.join(process.cwd(), "content", "metaphysics");

function parseNoteBlocks(source: string, body: string): ResearchNote[] {
  const blocks = body
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter((block) => block.includes("id:"));

  return blocks.flatMap((block) => {
    const values = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const match = /^([A-Za-z]+):\s*(.+)$/.exec(line.trim());
      if (match) values.set(match[1], match[2]);
    }

    const parsed = ResearchNoteSchema.safeParse({
      id: values.get("id"),
      system: values.get("system"),
      topic: values.get("topic"),
      claim: values.get("claim"),
      interpretiveUse: values.get("interpretiveUse"),
      source,
      confidence: "medium",
    });

    return parsed.success ? [parsed.data] : [];
  });
}

export function loadLocalKnowledgeNotes() {
  const files = readdirSync(knowledgeDir).filter((file) => file.endsWith(".md"));

  return files.flatMap((file) => {
    const absolutePath = path.join(knowledgeDir, file);
    const body = readFileSync(absolutePath, "utf8");
    return parseNoteBlocks(`local:content/metaphysics/${file}`, body);
  });
}

export function searchLocalKnowledge(input: {
  systems?: string[];
  topics?: string[];
  query?: string;
  limit?: number;
}): ResearchNote[] {
  const systems = new Set((input.systems ?? []).map((item) => item.toLowerCase()));
  const topics = new Set((input.topics ?? []).map((item) => item.toLowerCase()));
  const query = input.query?.toLowerCase();

  return loadLocalKnowledgeNotes()
    .map((note) => {
      const haystack = [note.system, note.topic, note.claim, note.interpretiveUse].join(" ").toLowerCase();
      let score = 0;
      if (systems.size === 0 || systems.has(note.system.toLowerCase())) score += 2;
      if (topics.size === 0 || topics.has(note.topic.toLowerCase())) score += 2;
      if (query && haystack.includes(query)) score += 3;
      return { note, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 10)
    .map(({ note }) => note);
}
