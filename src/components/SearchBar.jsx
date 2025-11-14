'use client';

import { useState, useEffect, useRef } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search for food products...' }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const lastSearchedRef = useRef('');
  const onSearchRef = useRef(onSearch);

  // Keep the ref updated with the latest onSearch function
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 800); // Increased debounce delay to reduce API calls

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    
    // Only search if query changed and is not empty
    if (normalizedQuery && normalizedQuery !== lastSearchedRef.current) {
      lastSearchedRef.current = normalizedQuery;
      onSearchRef.current(debouncedQuery);
    }
  }, [debouncedQuery]); // Removed onSearch from dependencies

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery && trimmedQuery.toLowerCase() !== lastSearchedRef.current) {
      lastSearchedRef.current = trimmedQuery.toLowerCase();
      setDebouncedQuery(trimmedQuery); // Trigger search immediately
      onSearch(trimmedQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </form>
  );
}

