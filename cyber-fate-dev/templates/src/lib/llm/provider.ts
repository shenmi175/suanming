import type { AgentRole } from "./modelConfig";

export interface AgentArtifact<T = unknown> {
  role: AgentRole;
  input: unknown;
  output: T;
  createdAt: string;
  model?: string;
  durationMs?: number;
}

export interface AgentRunner {
  runRole<TInput, TOutput>(args: {
    role: AgentRole;
    input: TInput;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
    parse: (value: unknown) => TOutput;
    systemPrompt: string;
  }): Promise<AgentArtifact<TOutput>>;
}

export class MockRunner implements AgentRunner {
  constructor(private readonly fixtures: Partial<Record<AgentRole, unknown>> = {}) {}

  async runRole<TInput, TOutput>(args: {
    role: AgentRole;
    input: TInput;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
    parse: (value: unknown) => TOutput;
    systemPrompt: string;
  }): Promise<AgentArtifact<TOutput>> {
    const output = this.fixtures[args.role] ?? {};
    return {
      role: args.role,
      input: args.input,
      output: args.parse(output),
      createdAt: new Date().toISOString(),
      model: "mock",
      durationMs: 0,
    };
  }
}
