import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini', // Use GPT-4-mini
});

const fileSummaryPrompt = PromptTemplate.fromTemplate(
  "Summarize the following code file in 50 words or less, focusing on main functions and important variables:\n\n{fileContent}"
);

const fileSummaryChain = RunnableSequence.from([
  fileSummaryPrompt,
  model,
]);

const repoMapPrompt = PromptTemplate.fromTemplate(
  "Create a repository map from the following file summaries:\n\n{fileSummaries}"
);

const repoMapChain = RunnableSequence.from([
  repoMapPrompt,
  model,
]);

async function summarizeFile(file) {
  const summary = await fileSummaryChain.invoke({ fileContent: file.content });
  return {
    path: file.path,
    summary: summary
  };
}

async function mapReduceRepoSummary(repoContents) {
  // Map: Summarize each file
  const fileSummaries = await Promise.all(
    Object.entries(repoContents).map(async ([path, content]) => {
      const summary = await summarizeFile({ path, content });
      return `${path}:\n${summary.summary}`;
    })
  );

  // Reduce: Combine summaries in chunks
  const chunkSize = 10;
  let finalSummary = '';
  for (let i = 0; i < fileSummaries.length; i += chunkSize) {
    const chunk = fileSummaries.slice(i, i + chunkSize);
    const chunkSummary = await summarizeRepo(chunk.join('\n\n'));
    finalSummary += chunkSummary + '\n\n';
  }

  // Final reduction
  return summarizeRepo(finalSummary);
}

async function summarizeRepo(fileSummaries) {
  const result = await repoMapChain.invoke({ fileSummaries });
  return result;
}

export async function POST(request) {
  const { action, content } = await request.json();

  if (action === 'summarizeFile') {
    const result = await fileSummaryChain.invoke({ fileContent: content });
    return NextResponse.json({ summary: result });
  } else if (action === 'createRepoMap') {
    const result = await repoMapChain.invoke({ fileSummaries: content });
    return NextResponse.json({ repoMap: result });
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
