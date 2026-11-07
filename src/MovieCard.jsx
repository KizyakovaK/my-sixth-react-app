import { useState, useEffect } from 'react';

const API_KEY = '34d6785';

function MovieCard({ movie, hideByYear }) {
  const [plot, setPlot] = useState(null);
  const [plotLoading, setPlotLoading] = useState(false);

  const posterUrl =
    movie.Poster && movie.Poster !== 'N/A'
      ? movie.Poster
      : 'https://via.placeholder.com/300x450?text=No+Poster';

  // Доп. задание 1: подгрузка описания по imdbID
  useEffect(() => {
    let cancelled = false;

    const fetchPlot = async () => {
      setPlotLoading(true);
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?i=${movie.imdbID}&plot=short&apikey=${API_KEY}`
        );
        const data = await res.json();
        if (!cancelled) {
          setPlot(data.Plot && data.Plot !== 'N/A' ? data.Plot : 'Описание отсутствует.');
        }
      } catch {
        if (!cancelled) setPlot('Не удалось загрузить описание.');
      } finally {
        if (!cancelled) setPlotLoading(false);
      }
    };

    fetchPlot();
    return () => {
      cancelled = true;
    };
  }, [movie.imdbID]);

  const yearNum = parseInt(movie.Year, 10);
  if (hideByYear && !Number.isNaN(yearNum)) return null;

  return (
    <article className="movie-card">
      <img src={posterUrl} alt={movie.Title} />
      <div className="movie-card-body">
        <h3>{movie.Title}</h3>
        <p>
          <strong>Год:</strong> {movie.Year}
        </p>

        {plotLoading ? (
          <p className="plot-loading">Загрузка описания…</p>
        ) : (
          <p className="plot">{plot}</p>
        )}
      </div>
    </article>
  );
}

export default MovieCard;