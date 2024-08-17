import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest';

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
        contents[item.path] = Buffer.from(fileContent.data.content, 'base64').toString('utf-8');
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

export async function POST(req) {
  const { repoUrl } = await req.json();

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'GitHub access token is missing' }, { status: 500 });
  }

  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const repoContents = await fetchRepoContents(owner, repo);
    return NextResponse.json(repoContents);
  } catch (error) {
    console.error('Error in POST /api/getrepo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
