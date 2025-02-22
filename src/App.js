import logo from './logo.svg';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import './App.css';

function App() {
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('c');
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState(null);
  const observer = useRef();
  const sentinelRef = useRef();

  // Load repositories whenever page changes
  useEffect(() => {
    const loadRepos = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/repos', {
          params: { query, page, per_page: 10 }
        });
        setRepos(prev => [...prev, ...res.data.items]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadRepos();
  }, [page, query]);

  // Setup infinite scrolling using Intersection Observer
  useEffect(() => {
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) {
        setPage(prev => prev + 1);
      }
    });
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }
    return () => observer.current.disconnect();
  }, [loading]);

  // Fetch README content for a repository
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
        {/* {repos.map(repo => (
          <div key={repo.id} className="repo-card">
            <h2>{repo.full_name}</h2>
            <p>{repo.description}</p>
            <button onClick={() => fetchReadme(repo.owner.login, repo.name)}>
              View README
            </button>
          </div>
        ))} */}
        {repos.map((repo, index) => (
          <div key={`${repo.id}-${index}`} className="repo-card">
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
  // return (
  //   <div className="App">
  //     <h1>Hello world</h1>
  //   </div>
  // );
}

export default App;
