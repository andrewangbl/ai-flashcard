import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

function parseGitHubUrl(url) {
  const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(regex);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  throw new Error('Invalid GitHub URL');
}

async function fetchRepoContents(owner, repo, path = '') {
  try {
    const response = await octokit.repos.getContent({ owner, repo, path });
    let contents = {};

    for (const item of response.data) {
      if (item.type === 'file') {
        const fileContent = await octokit.repos.getContent({ owner, repo, path: item.path });
        contents[item.path] = {
          content: Buffer.from(fileContent.data.content, 'base64').toString('utf-8'),
          path: item.path
        };
      } else if (item.type === 'dir') {
        const subDirContents = await fetchRepoContents(owner, repo, item.path);
        contents = { ...contents, ...subDirContents };
      }
    }

    return contents;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return {};
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function summarizeFile(file) {
  await delay(200); // Add a 200ms delay before each API call
  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-4-1106-preview'
  });

  const prompt = PromptTemplate.fromTemplate(
    "Summarize the following code file in 50 words or less, focusing on main functions and important variables:\n\n{content}"
  );

  const chain = RunnableSequence.from([prompt, model]);

  const result = await chain.invoke({
    content: file.content
  });

  return {
    path: file.path,
    summary: result.content
  };
}

async function summarizeRepo(repoContents) {
  const summaries = await Promise.all(
    Object.values(repoContents).map(summarizeFile)
  );

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo'
  });

  const prompt = PromptTemplate.fromTemplate(
    "Create a repository map from the following file summaries:\n\n{summaries}"
  );

  const chain = RunnableSequence.from([prompt, model]);

  const result = await chain.invoke({
    summaries: summaries.map(s => `${s.path}:\n${s.summary}`).join('\n\n')
  });

  return result.content;
}

async function mapReduceRepoSummary(repoContents) {
  const MAX_FILES = 25; // Set a maximum number of files to process
  const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.cpp', '.c', '.h', '.hpp'];

  const files = Object.entries(repoContents).filter(([path]) =>
    codeExtensions.some(ext => path.toLowerCase().endsWith(ext))
  );

  if (files.length > MAX_FILES) {
    throw new Error(`Repository has too many code files. Maximum ${MAX_FILES} files allowed, but found ${files.length} code files.`);
  }

  // Map: Summarize each file
  const fileSummaries = await Promise.all(
    files.map(async ([path, content]) => {
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

export async function POST(req) {
  const { repoUrl } = await req.json();

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'GitHub access token is missing' }, { status: 500 });
  }

  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const repoContents = await fetchRepoContents(owner, repo);
    const repoMap = await mapReduceRepoSummary(repoContents);
    return NextResponse.json(repoMap);
  } catch (error) {
    console.error('Error in POST /api/getrepo:', error);
    if (error.message.includes('Repository has too many code files')) {
      return NextResponse.json({ error: error.message }, { status: 413 }); // 413 Payload Too Large
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
