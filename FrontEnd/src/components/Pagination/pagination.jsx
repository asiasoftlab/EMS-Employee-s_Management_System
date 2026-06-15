import React from 'react';
import './pagination.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="pagination-btn pagination-prev-next"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i + 1}
          onClick={() => onPageChange(i + 1)}
          className={`pagination-btn pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
        >
          {i + 1}
        </button>
      ))}
      <button 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-prev-next"
      >
        Next
      </button>
    </div>
  );
}
