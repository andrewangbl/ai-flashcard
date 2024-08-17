import { useState } from 'react';

export default function RepoForm({ onSubmit }) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ repoUrl });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="GitHub Repository URL"
        required
      />
      <button type="submit">Fetch Repository</button>
    </form>
  );
}
