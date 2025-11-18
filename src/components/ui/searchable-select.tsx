
"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, X, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  onSearchChange: (query: string) => void
  placeholder?: string
  label?: string
  isLoading?: boolean
  disabled?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onSearchChange,
  placeholder,
  label,
  isLoading = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  useEffect(() => {
    if (selectedOption && !isOpen) {
      setQuery(selectedOption.label)
    } else if (!value) {
      setQuery('')
    }
  }, [selectedOption, value, isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1)
      if (selectedOption) {
        setQuery(selectedOption.label)
      } else if (!value) {
        setQuery('')
        onSearchChange('')
      }
    }
  }, [isOpen, selectedOption, value, onSearchChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    onSearchChange(newQuery)
    if (!isOpen) setIsOpen(true)
    if (newQuery === '') {
      onChange('')
    }
  }

  const handleSelectOption = (option: SearchableSelectOption) => {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    onChange('')
    onSearchChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        handleSelectOption(options[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className='w-full' ref={wrapperRef}>
      {label && (
        <label className='block text-sm font-medium text-muted-foreground mb-1'>
          {label}
        </label>
      )}
      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-12')}
        />
        <div className='absolute inset-y-0 right-0 flex items-center pr-2'>
          {isLoading && (
            <LoaderCircle className='h-5 w-5 text-muted-foreground animate-spin mr-1' />
          )}
          {query && !isLoading && !disabled && (
            <button
              type='button'
              onClick={handleClear}
              className='p-1 text-muted-foreground hover:text-foreground'
            >
              <X size={16} />
            </button>
          )}
          <div className='h-full border-l border-border mx-2'></div>
          <button
            type='button'
            className='p-1 text-muted-foreground hover:text-foreground'
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
          >
            <ChevronDown
              size={20}
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {isOpen && !disabled && (
          <ul className='absolute z-20 w-full mt-1 bg-background shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm'>
            {options.length > 0 ? (
              options.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn('cursor-pointer select-none relative py-2 pl-3 pr-9', {
                    'bg-accent text-accent-foreground': highlightedIndex === index,
                    'text-foreground': highlightedIndex !== index,
                  })}
                >
                  <span className='block truncate'>{option.label}</span>
                </li>
              ))
            ) : !isLoading ? (
              <li className='px-3 py-2 text-muted-foreground'>
                {query
                  ? 'Tidak ada hasil ditemukan.'
                  : 'Mulai ketik untuk mencari...'}
              </li>
            ) : null}
             {isLoading && (
                <li className='px-3 py-2 text-muted-foreground'>
                    Memuat...
                </li>
             )}
          </ul>
        )}
      </div>
    </div>
  )
}

export default SearchableSelect;

    