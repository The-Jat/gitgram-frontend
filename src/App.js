import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { debounce } from 'lodash';
import './App.css';

function App() {
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('c');
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState(null);
  const observer = useRef();
  const sentinelRef = useRef();

  // Debounced API Call
  const debouncedLoadRepos = debounce(async (query, page) => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/repos', {
        params: { query, page, per_page: 10 }
      });
      setRepos(prev => {
        const newRepos = res.data.items.filter(repo => !prev.some(r => r.id === repo.id));
        return [...prev, ...newRepos];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Load repositories whenever page/query changes
  useEffect(() => {
    debouncedLoadRepos(query, page);
  }, [query, page]);

  // Observer callback for infinite scrolling
  const observerCallback = useCallback(entries => {
    if (entries[0].isIntersecting && !loading) {
      setPage(prev => prev + 1);
    }
  }, [loading]);

  // Setup Intersection Observer
  useEffect(() => {
    observer.current = new IntersectionObserver(observerCallback);
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }
    return () => observer.current.disconnect();
  }, [observerCallback]);

  // Fetch README content
  const fetchReadme = async (owner, repo) => {
    try {
      const res = await axios.get('http://localhost:5000/api/readme', {
        params: { owner, repo }
      });
      setReadme(marked(res.data));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>GitHub Repos Feed</h1>
      </header>
      <main>
        {repos.map(repo => (
          <div key={repo.id} className="repo-card">
            <h2>{repo.full_name}</h2>
            <p>{repo.description}</p>
            <button onClick={() => fetchReadme(repo.owner.login, repo.name)}>
              View README
            </button>
          </div>
        ))}
        {loading && <p>Loading more repositories...</p>}
        <div ref={sentinelRef} style={{ height: '20px' }}></div>
      </main>
      {readme && (
        <div className="readme-modal">
          <div className="readme-content">
            <h2>README</h2>
            <div dangerouslySetInnerHTML={{ __html: readme }} />
            <button onClick={() => setReadme(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
