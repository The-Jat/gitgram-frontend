import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';  // For making HTTP requests to backend
import { marked } from 'marked';  // For rendering Markdown (README file) to HTML
import { debounce } from 'lodash';  // To avoid sending too many requests quickly.
import './App.css';

function App() {
  /*
  * ======= MAIN STATES =======
  * These store the "final" search parameters that are used to fetch data from the API.
  */
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

  /*
  * ======= TEMPORARY STATES =======
  * These store the temporary values of the search parameters as the user modifies them in the UI.
  */
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

  /*
  * ======= API CALLS TO LOAD REPOSITORIES =======
  * This function fetches repos from the backend API based on the current search parameters.
  * It is debounced to prevent excessive calls when parameters change rapidly.
  * It appends new repos to the existing list, ensuring no duplicates.
  */
  // Debounced API Call using final search parameters (including new filters)
  const debouncedLoadRepos = debounce(
    async (query, page, language, sort, order, license, minStars, keywords, topics) => {
      setLoading(true); // Start loading
      try {
        // Call backend API to fetch repositories
        const res = await axios.get('http://localhost:5000/api/repos', {
          params: {
            query,
            page,
            per_page: 10, // Number of repos per page
            language,
            sort,
            order,
            license,
            minStars,
            keywords,
            topics
          }
        });

        // Update repo list, avoid duplicates
        setRepos(prev => {
          const newRepos = res.data.items.filter(repo => !prev.some(r => r.id === repo.id));
          return [...prev, ...newRepos];
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);  // Done loading 
      }
    },
    300 // 300ms debounce interval
  );

  /*
  * ======= FETCH DATA WHEN FILTERS CHANGE =======
  * Whenever any of the final search parameters change, we call the debounced function to load repos.
  * This ensures that we fetch new data based on the latest filters.
  */
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

  /*
  * ======= INFINITE SCROLLING SETUP =======
  * We use the Intersection Observer API to implement infinite scrolling.
  * When the sentinel element comes into view, we increment the page number to load more repos
  * if we are not already loading data.
  */
  useEffect(() => {
    observer.current = new IntersectionObserver(observerCallback);
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }
    return () => observer.current.disconnect();
  }, [observerCallback]);

  /*
  * ======= FETCH AND RENDER README =======
  */
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

  /*
  * ======= APPLY FILTERS =======
  * This function is called when the user clicks the "Search" button.
  * It updates the final search parameters with the temporary values
  * and resets the page number and repo list to start fresh.
  * This ensures that the new filters are applied correctly.
  */
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
