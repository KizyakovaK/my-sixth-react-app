import { useState, useEffect, useMemo } from 'react';
import MovieCard from './MovieCard';
import SearchHistory from './SearchHistory';
import './index.css';

const API_KEY = '34d6785';

const HISTORY_KEY = 'movie_search_history';
const HISTORY_LIMIT = 5;

function App() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [error, setError] = useState(null);

  // Доп. 2: пагинация
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [lastQuery, setLastQuery] = useState(''); // запрос, для которого сейчас идёт пагинация

  // Доп. 3: фильтр по году
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  // Доп. 4: история поиска
  const [history, setHistory] = useState([]);

  // ---------- История из localStorage ----------
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) setHistory(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const addToHistory = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const filtered = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, HISTORY_LIMIT);
    saveHistory(updated);
  };

  const clearHistory = () => saveHistory([]);

  // ---------- Запрос к OMDb ----------
  const fetchMovies = async (searchQuery, pageNum = 1) => {
    setStatus('loading');
    setError(null);

    try {
      const url = `https://www.omdbapi.com/?s=${encodeURIComponent(
        searchQuery
      )}&page=${pageNum}&apikey=${API_KEY}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error('Ошибка сети');

      const data = await res.json();

      if (data.Error) {
        setMovies([]);
        setTotalResults(0);
        setStatus('error');
        setError('Ничего не найдено');
        return;
      }

      setMovies(data.Search || []);
      setTotalResults(parseInt(data.totalResults || '0', 10));
      setPage(pageNum);
      setLastQuery(searchQuery);
      setStatus('success');
    } catch (err) {
      setMovies([]);
      setTotalResults(0);
      setStatus('error');
      setError(err.message);
    }
  };

  // ---------- Обработчики ----------
  const handleSearch = () => {
    if (!query.trim()) {
      setMovies([]);
      setStatus('idle');
      setError(null);
      setTotalResults(0);
      return;
    }
    addToHistory(query);
    fetchMovies(query, 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHistorySelect = (q) => {
    setQuery(q);
    addToHistory(q);
    fetchMovies(q, 1);
  };

  // Доп. 2: пагинация
  const totalPages = Math.ceil(totalResults / 10);
  const goPrev = () => {
    if (page > 1) fetchMovies(lastQuery, page - 1);
  };
  const goNext = () => {
    if (page < totalPages) fetchMovies(lastQuery, page + 1);
  };

  // ---------- Доп. 3: клиентская фильтрация по году ----------
  const filteredMovies = useMemo(() => {
    const from = yearFrom ? parseInt(yearFrom, 10) : null;
    const to = yearTo ? parseInt(yearTo, 10) : null;

    return movies.filter((m) => {
      const year = parseInt(m.Year, 10);
      if (Number.isNaN(year)) return true;
      if (from !== null && year < from) return false;
      if (to !== null && year > to) return false;
      return true;
    });
  }, [movies, yearFrom, yearTo]);

  // ---------- Автопоиск (debounce) ----------
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        fetchMovies(query, 1);
      } else if (query.trim().length === 0) {
        setMovies([]);
        setStatus('idle');
        setError(null);
        setTotalResults(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="app">
      <h1>🎬 Поиск фильмов</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Введите название фильма..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch} disabled={status === 'loading'}>
          {status === 'loading' ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {/* Доп. 4: история */}
      <SearchHistory
        history={history}
        onSelect={handleHistorySelect}
        onClear={clearHistory}
      />

      {/* Доп. 3: фильтр по году */}
      <div className="year-filter">
        <label>
          Год от:
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            placeholder="1990"
          />
        </label>
        <label>
          Год до:
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            placeholder="2024"
          />
        </label>
        {(yearFrom || yearTo) && (
          <button
            className="year-reset"
            onClick={() => {
              setYearFrom('');
              setYearTo('');
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="hint">Введите название фильма и нажмите «Найти».</p>
      )}

      {status === 'loading' && <p className="loading">Загрузка...</p>}

      {status === 'error' && (
        <div className="error">
          <p>Ошибка: {error}</p>
        </div>
      )}

      {status === 'success' && filteredMovies.length === 0 && (
        <p>Ничего не найдено по вашему запросу.</p>
      )}

      {status === 'success' && filteredMovies.length > 0 && (
        <>
          <div className="movie-list">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </div>

          {/* Доп. 2: пагинация */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={goPrev} disabled={page <= 1 || status === 'loading'}>
                ← Предыдущая
              </button>
              <span>
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={goNext}
                disabled={page >= totalPages || status === 'loading'}
              >
                Следующая →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;