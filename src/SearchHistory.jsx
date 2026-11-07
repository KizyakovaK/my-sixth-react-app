function SearchHistory({ history, onSelect, onClear }) {
  if (history.length === 0) return null;

  return (
    <div className="history">
      <div className="history-header">
        <span>История поиска:</span>
        <button className="history-clear" onClick={onClear}>
          Очистить
        </button>
      </div>
      <div className="history-list">
        {history.map((item) => (
          <button
            key={item}
            className="history-item"
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchHistory;