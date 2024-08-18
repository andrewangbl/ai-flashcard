"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTreeSitter, parseRepo, toTree } from '../utils/treeSitterParser';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap, chatFiles }) {
  const parsers = useTreeSitter();
  const [parsedRepo, setParsedRepo] = useState({});
  const [treeView, setTreeView] = useState('');

  useEffect(() => {
    if (parsers && repoMap) {
      parseRepo(parsers, repoMap).then(parsed => {
        setParsedRepo(parsed);
        setTreeView(toTree(parsed, chatFiles));
      });
    }
  }, [parsers, repoMap, chatFiles]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '600px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h5" component="h2" sx={{ marginBottom: 2 }}>
          Repository Structure
        </Typography>
        <Box className={styles.fileContent} sx={{ maxHeight: '400px', overflowY: 'auto', padding: 2, textAlign: 'left', bgcolor: '#F9F9F9', borderRadius: 1 }}>
          <pre>{treeView}</pre>
        </Box>
      </Paper>
    </Box>
  );
}
