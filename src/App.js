import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { debounce } from 'lodash';
import './App.css';

function App() {
  // Final search parameters used for API calls
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('c');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('stars');
  const [order, setOrder] = useState('desc');
  const [license, setLicense] = useState('');
  const [minStars, setMinStars] = useState('');
  const [keywords, setKeywords] = useState('');
  const [topics, setTopics] = useState('');
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState(null);

  // Temporary state for the filter inputs
  const [tempQuery, setTempQuery] = useState(query);
  const [tempLanguage, setTempLanguage] = useState(language);
  const [tempSort, setTempSort] = useState(sort);
  const [tempOrder, setTempOrder] = useState(order);
  const [tempLicense, setTempLicense] = useState(license);
  const [tempMinStars, setTempMinStars] = useState(minStars);
  const [tempKeywords, setTempKeywords] = useState(keywords);
  const [tempTopics, setTempTopics] = useState(topics);

  const observer = useRef();
  const sentinelRef = useRef();

  // Debounced API Call using final search parameters (including new filters)
  const debouncedLoadRepos = debounce(
    async (query, page, language, sort, order, license, minStars, keywords, topics) => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/repos', {
          params: {
            query,
            page,
            per_page: 10,
            language,
            sort,
            order,
            license,
            minStars,
            keywords,
            topics
          }
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
    },
    300
  );

  // Load repositories when final filters change
  useEffect(() => {
    debouncedLoadRepos(query, page, language, sort, order, license, minStars, keywords, topics);
  }, [query, page, language, sort, order, license, minStars, keywords, topics]);

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

  // Apply filters when Search button is clicked
  const applyFilters = () => {
    setQuery(tempQuery);
    setLanguage(tempLanguage);
    setSort(tempSort);
    setOrder(tempOrder);
    setLicense(tempLicense);
    setMinStars(tempMinStars);
    setKeywords(tempKeywords);
    setTopics(tempTopics);
    setPage(1);
    setRepos([]); // Clear previous results before loading new ones
  };

  return (
    <div className="App">
      <header>
        <h1>GitHub Repos Feed</h1>
      </header>
      <div className="content">
        {/* Sidebar for Filters */}
        <aside className="sidebar">
          <div className="sidebar-div">
            <h2>Filters</h2>
            <label>
              Search:
              <input
                type="text"
                value={tempQuery}
                onChange={e => setTempQuery(e.target.value)}
              />
            </label>
            <label>
              Language:
              <select
                value={tempLanguage}
                onChange={e => setTempLanguage(e.target.value)}
              >
                <option value="">Any</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </label>
            {/* <label>
              License:
              <select
                value={tempLicense}
                onChange={e => setTempLicense(e.target.value)}
              >
                <option value="">Any</option>
                <option value="mit">MIT</option>
                <option value="gpl-3.0">GPL-3.0</option>
                <option value="apache-2.0">Apache-2.0</option>
                <option value="isc">ISC</option>
              </select>
            </label> */}
            {/* <label>
              Minimum Stars:
              <input
                type="number"
                value={tempMinStars}
                onChange={e => setTempMinStars(e.target.value)}
                placeholder="e.g., 50"
              />
            </label> */}
            <label>
              Keywords:
              <input
                type="text"
                value={tempKeywords}
                onChange={e => setTempKeywords(e.target.value)}
                placeholder="Comma-separated keywords"
              />
            </label>
            <label>
              Topics:
              <input
                type="text"
                value={tempTopics}
                onChange={e => setTempTopics(e.target.value)}
                placeholder="Comma-separated topics"
              />
            </label>
            <label>
              Sort by:
              <select
                value={tempSort}
                onChange={e => setTempSort(e.target.value)}
              >
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="updated">Recently Updated</option>
              </select>
            </label>
            <label>
              Order:
              <select
                value={tempOrder}
                onChange={e => setTempOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
            <button onClick={applyFilters}>Search</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="repo-container">
          {repos.map(repo => (
            <div key={repo.id} className="repo-card">
              <h2>{repo.full_name}</h2>
              <p>{repo.description}</p>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                Visit Repository
              </a>
              <button onClick={() => fetchReadme(repo.owner.login, repo.name)}>
                View README
              </button>
            </div>
          ))}
          {loading && <p>Loading more repositories...</p>}
          <div ref={sentinelRef} style={{ height: '20px' }}></div>
        </main>
      </div>

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
