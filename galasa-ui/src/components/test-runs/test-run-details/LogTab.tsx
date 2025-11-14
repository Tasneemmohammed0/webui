/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Search, OverflowMenu, Button } from '@carbon/react';
import styles from '@/styles/test-runs/test-run-details/LogTab.module.css';
import { Checkbox } from '@carbon/react';
import {
  Filter,
  ChevronUp,
  ChevronDown,
  CloudDownload,
  Term,
  LetterAa,
  Copy,
} from '@carbon/icons-react';
import { handleDownload } from '@/utils/artifacts';
import { useTranslations } from 'next-intl';

interface LogLine {
  content: string;
  level: string;
  lineNumber: number;
  isVisible: boolean;
}

interface MatchInfo {
  lineIndex: number;
  start: number;
  end: number;
  globalIndex: number;
}

enum RegexFlags {
  AllMatches = 'g',
  AllMatchesIgnoreCase = 'gi',
}

interface LogTabProps {
  logs: string;
  initialLine?: number;
}

interface selectedRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

const SELECTION_CHANGE_EVENT = 'selectionchange';
const HASH_CHANGE_EVENT = 'hashchange';

export default function LogTab({ logs, initialLine }: LogTabProps) {
  const translations = useTranslations('LogTab');

  const [logContent, setLogContent] = useState<string>('');
  const [processedLines, setProcessedLines] = useState<LogLine[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [matchWholeWord, setMatchWholeWord] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    ERROR: true,
    WARN: true,
    DEBUG: true,
    INFO: true,
    TRACE: true,
  });
  const [selectedRange, setSelectedRange] = useState<selectedRange | null>(null);

  // Cache for search results to avoid recomputation
  const [searchCache, setSearchCache] = useState<Map<string, MatchInfo[]>>(new Map());

  // State to track the URL hash, initialized to the value of the first render
  const [currentHash, setCurrentHash] = useState<string>(
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  const logContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DEBOUNCE_DELAY_MILLISECONDS = 300;

  const handleSearchChange = (e: any) => {
    const value = e.target?.value || '';
    setSearchTerm(value);

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
      if (!value.trim()) {
        setCurrentMatchIndex(-1);
        setTotalMatches(0);
      }
    }, DEBOUNCE_DELAY_MILLISECONDS);
  };

  const handleFilterChange = (level: string) => {
    setFilters((prev) => ({
      ...prev,
      [level]: !prev[level as keyof typeof prev],
    }));
  };

  const handleCopyPermalink = () => {
    if (!selectedRange) return;

    // Use the stored logical start/end from the state
    const { startLine, endLine, startOffset, endOffset } = selectedRange;

    // Construct the base URL from its parts to explicitly exclude any existing hash
    const baseUrl = window.location.origin + window.location.pathname + window.location.search;

    const permalink = `${baseUrl}#log-${startLine}-${startOffset}-${endLine}-${endOffset}`;

    navigator.clipboard.writeText(permalink);

    // Clear selection after copying
    setSelectedRange(null);
  };

  const toggleMatchCase = () => {
    setMatchCase(!matchCase);

    // Clear cache when search options change
    setSearchCache(new Map());
  };

  const toggleMatchWholeWord = () => {
    setMatchWholeWord(!matchWholeWord);

    // Clear cache when search options change
    setSearchCache(new Map());
  };

  const goToNextMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
    }
  };

  const goToPreviousMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  // Memoized regex creation to avoid recreating the same regex repeatedly
  const searchRegex = useMemo(() => {
    let regex: RegExp | null = null;

    if (debouncedSearchTerm.trim()) {
      let escapedTerm = debouncedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) {
        escapedTerm = `\\b${escapedTerm}\\b`;
      }
      const flags = matchCase ? RegexFlags.AllMatches : RegexFlags.AllMatchesIgnoreCase;
      regex = new RegExp(escapedTerm, flags);
    }

    return regex;
  }, [debouncedSearchTerm, matchCase, matchWholeWord]);

  const getLogLevel = (line: string) => {
    let logLevel: string | null = null;

    // Attempt to parse a timestamp and log level by splitting the line.
    const tokens = line.trim().split(' ');
    if (
      tokens.length >= 3 &&
      tokens[0].length === 10 && // Simple check for DD/MM/YYYY format
      tokens[0].charAt(2) === '/' &&
      tokens[0].charAt(5) === '/' &&
      tokens[1].includes(':') &&
      tokens[1].includes('.')
    ) {
      if (['ERROR', 'WARN', 'DEBUG', 'INFO', 'TRACE'].includes(tokens[2])) {
        logLevel = tokens[2];
      }
    }

    // Fallback: check if the line starts with any log level
    if (!logLevel) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('ERROR')) {
        logLevel = 'ERROR';
      } else if (trimmedLine.startsWith('WARN')) {
        logLevel = 'WARN';
      } else if (trimmedLine.startsWith('DEBUG')) {
        logLevel = 'DEBUG';
      } else if (trimmedLine.startsWith('INFO')) {
        logLevel = 'INFO';
      } else if (trimmedLine.startsWith('TRACE')) {
        logLevel = 'TRACE';
      }
    }

    return logLevel;
  };

  // Search function that computes all matches once and caches results
  const computeSearchMatches = useCallback(
    (lines: LogLine[], regex: RegExp | null): MatchInfo[] => {
      let result: MatchInfo[] = [];

      if (!regex || !debouncedSearchTerm.trim()) {
        result = [];
      } else {
        try {
          // Create cache key
          const cacheKey = `${debouncedSearchTerm}-${matchCase}-${matchWholeWord}-${lines.map((l) => l.isVisible).join('')}`;

          // Check cache first
          if (searchCache.has(cacheKey)) {
            result = searchCache.get(cacheKey)!;
          } else {
            const matches: MatchInfo[] = [];
            let globalIndex = 0;

            lines.forEach((line, lineIndex) => {
              if (!line.isVisible) return;

              // Reset regex lastIndex to ensure we get all matches
              regex.lastIndex = 0;
              let match;

              while ((match = regex.exec(line.content)) !== null) {
                matches.push({
                  lineIndex,
                  start: match.index,
                  end: match.index + match[0].length,
                  globalIndex: globalIndex++,
                });

                // Prevent infinite loop on zero-length matches
                if (match.index === regex.lastIndex) {
                  regex.lastIndex++;
                }
              }
            });

            // Cache the results
            setSearchCache((prev) => new Map(prev).set(cacheKey, matches));
            result = matches;
          }
        } catch (error) {
          console.warn('Regex execution error:', error);
          result = [];
        }
      }

      return result;
    },
    [debouncedSearchTerm, matchCase, matchWholeWord, searchCache]
  );

  const searchMatches = useMemo(() => {
    return computeSearchMatches(processedLines, searchRegex);
  }, [processedLines, searchRegex, computeSearchMatches]);

  const highlightText = useCallback(
    (text: string, lineIndex: number): React.ReactNode => {
      let result: React.ReactNode = text;

      if (searchRegex && debouncedSearchTerm.trim()) {
        const lineMatches = searchMatches.filter((match) => match.lineIndex === lineIndex);

        if (lineMatches.length > 0) {
          const resultArray: React.ReactNode[] = [];
          let lastEnd = 0;

          lineMatches.forEach((match, matchIndex) => {
            // Add text before match
            if (match.start > lastEnd) {
              resultArray.push(text.substring(lastEnd, match.start));
            }

            // Add highlighted match
            const isCurrentMatch = match.globalIndex === currentMatchIndex;
            const matchText = text.substring(match.start, match.end);

            resultArray.push(
              <span
                key={`match-${lineIndex}-${matchIndex}`}
                className={`${styles.highlight} ${isCurrentMatch ? styles.currentHighlight : ''}`}
                id={isCurrentMatch ? 'current-match' : undefined}
              >
                {matchText}
              </span>
            );

            lastEnd = match.end;
          });

          // Add remaining text after last match
          if (lastEnd < text.length) {
            resultArray.push(text.substring(lastEnd));
          }

          result = resultArray;
        }
      }

      return result;
    },
    [searchRegex, debouncedSearchTerm, searchMatches, currentMatchIndex]
  );

  const visibleLines = useMemo(() => {
    return processedLines.filter((line) => line.isVisible);
  }, [processedLines]);

  const renderLogContent = () => {
    let result: JSX.Element[] | null = null;

    if (visibleLines.length === 0) {
      result = null;
    } else {
      result = visibleLines.map((logLine) => {
        const levelClass = logLine.level.toLowerCase();
        const colorClass = styles[levelClass as keyof typeof styles] || '';

        // Add a background highlight to all lines in the selected range
        const isLineSelected =
          selectedRange &&
          logLine.lineNumber >= selectedRange.startLine &&
          logLine.lineNumber <= selectedRange.endLine;

        return (
          <div
            key={logLine.lineNumber}
            id={`log-line-${logLine.lineNumber}`}
            className={`${colorClass} ${styles.logEntry} ${isLineSelected ? styles.lineSelected : ''}`}
          >
            <span className={styles.lineNumberCol}>{logLine.lineNumber}.</span>
            <pre>{highlightText(logLine.content, processedLines.indexOf(logLine))}</pre>
          </div>
        );
      });
    }

    return result;
  };

  // Effect to select/deselect lines based on user selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selected = window.getSelection();

      // Ignore if no selection or just a single click
      if (!selected || selected.isCollapsed) {
        setSelectedRange(null);
        return;
      }

      // Set the selection state with start and end lines
      const startLineEl = selected.anchorNode?.parentElement?.closest('[id^="log-line-"]');
      const endLineEl = selected.focusNode?.parentElement?.closest('[id^="log-line-"]');

      if (startLineEl && endLineEl) {
        const anchorLineNum = parseInt(startLineEl.id.split('-')[2]);
        const focusLineNum = parseInt(endLineEl.id.split('-')[2]);

        // Determine the true start/end regardless of selection direction
        const isSelectingForward =
          anchorLineNum < focusLineNum ||
          (anchorLineNum === focusLineNum && selected.anchorOffset <= selected.focusOffset);

        const startLine = isSelectingForward ? anchorLineNum : focusLineNum;
        const endLine = isSelectingForward ? focusLineNum : anchorLineNum;
        const startOffset = isSelectingForward ? selected.anchorOffset : selected.focusOffset;
        const endOffset = isSelectingForward ? selected.focusOffset : selected.anchorOffset;

        setSelectedRange({ startLine, endLine, startOffset, endOffset });
      }
    };

    document.addEventListener(SELECTION_CHANGE_EVENT, handleSelectionChange);

    return () => {
      document.removeEventListener(SELECTION_CHANGE_EVENT, handleSelectionChange);
    };
  }, []);

  // Effect to listen to the browser hash changes and updates the state that runs only on mount
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener(HASH_CHANGE_EVENT, handleHashChange);
    return () => {
      window.removeEventListener(HASH_CHANGE_EVENT, handleHashChange);
    };
  }, []);

  // Effect to scroll to selected lines
  useEffect(() => {
    // Exit if logs aren't processed
    if (processedLines.length === 0) {
      return;
    }

    const hash = currentHash || window.location.hash;

    // Check for a line range in the URL hash
    if (hash.startsWith('#log-')) {
      const parts = hash.substring(5).split('-');
      if (parts.length === 4) {
        const [startLine, startOffset, endLine, endOffset] = parts.map((p) => parseInt(p, 10));

        if (![startLine, startOffset, endLine, endOffset].some(isNaN)) {
          // Set the selection state
          setSelectedRange({ startLine, startOffset, endLine, endOffset });

          // Find the elements and text nodes to create the selection
          const startElement = document.getElementById(`log-line-${startLine}`);
          const endElement = document.getElementById(`log-line-${endLine}`);
          const startNode = startElement?.querySelector('pre')?.firstChild;
          const endNode = endElement?.querySelector('pre')?.firstChild;

          if (startNode && endNode) {
            // Validate offsets
            const validStartOffset = Math.min(startOffset, startNode.textContent?.length || 0);
            const validEndOffset = Math.min(endOffset, endNode.textContent?.length || 0);

            // Create the highlighted range
            const range = document.createRange();
            range.setStart(startNode, validStartOffset);
            range.setEnd(endNode, validEndOffset);

            // Override any existing selection
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }

            startElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }
      }
    }
  }, [processedLines, currentHash]);

  // Effect to scroll to the initial line
  useEffect(() => {
    if (initialLine && processedLines.length > 0) {
      const lineElement = document.getElementById(`log-line-${initialLine - 1}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialLine, processedLines]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchIndex >= 0) {
      const currentMatchElement = document.getElementById('current-match');
      if (currentMatchElement) {
        currentMatchElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentMatchIndex]);

  useEffect(() => {
    const matchCount = searchMatches.length;
    setTotalMatches(matchCount);

    if (matchCount > 0 && currentMatchIndex === -1) {
      setCurrentMatchIndex(0);
    } else if (matchCount === 0) {
      setCurrentMatchIndex(-1);
    } else if (currentMatchIndex >= matchCount) {
      setCurrentMatchIndex(matchCount - 1);
    }
  }, [searchMatches, currentMatchIndex, debouncedSearchTerm]);

  // Process log content and apply filters
  useEffect(() => {
    const processLogLines = (content: string) => {
      const lines = content.split('\n');
      const processed: LogLine[] = [];
      let currentLevel = 'INFO'; // Default level

      lines.forEach((line, index) => {
        const detectedLevel = getLogLevel(line);

        // If we find a new level, update current level
        if (detectedLevel) {
          currentLevel = detectedLevel;
        }

        // All lines get assigned to the current level (either explicit or inherited)
        processed.push({
          content: line,
          level: currentLevel,
          lineNumber: index + 1,
          isVisible: true,
        });
      });

      return processed;
    };

    const applyFilters = (lines: LogLine[]) => {
      let filteredLines = [];
      const hasActiveFilters = Object.values(filters).some((filter) => filter === true);

      if (!hasActiveFilters) {
        // If no filters are active, hide all lines
        filteredLines = lines.map((line) => ({ ...line, isVisible: false }));
      } else {
        // Only show lines whose level is checked in the filters
        filteredLines = lines.map((line) => ({
          ...line,
          isVisible: !!filters[line.level as keyof typeof filters],
        }));
      }

      return filteredLines;
    };

    if (logContent) {
      const processed = processLogLines(logContent);
      const filtered = applyFilters(processed);
      setProcessedLines(filtered);
    }
  }, [logContent, filters]);

  // Clear cache when filters change
  useEffect(() => {
    setSearchCache(new Map());
  }, [filters]);

  useEffect(() => {
    setLogContent(logs);
  }, [logs]);

  // Cleanup the timeout on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const copyPermalinkText = selectedRange?.startLine
    ? translations('copyPermalinkButton')
    : translations('selectLinesToCreatePermalink');

  return (
    <div>
      <h3>{translations('title')}</h3>
      <p>{translations('description')}</p>
      <div className={styles.logContainer}>
        <div className={styles.searchContainer}>
          <Search
            placeholder={translations('searchPlaceholder')}
            size="lg"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {debouncedSearchTerm && (
            <div className={styles.findControls}>
              <span className={styles.matchCounter} data-testid="match-counter">
                {totalMatches > 0
                  ? translations('matchCounter', {
                      current: currentMatchIndex + 1,
                      total: totalMatches,
                    })
                  : translations('noMatches')}
              </span>
              <Button
                kind="ghost"
                size="sm"
                onClick={goToPreviousMatch}
                disabled={totalMatches === 0}
                renderIcon={ChevronUp}
                iconDescription={translations('matchPrevious')}
                hasIconOnly
              />
              <Button
                kind="ghost"
                size="sm"
                onClick={goToNextMatch}
                disabled={totalMatches === 0}
                renderIcon={ChevronDown}
                iconDescription={translations('matchNext')}
                hasIconOnly
              />
              <Button
                kind={matchCase ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleMatchCase}
                renderIcon={LetterAa}
                iconDescription={translations('matchCase')}
                hasIconOnly
              />
              <Button
                kind={matchWholeWord ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleMatchWholeWord}
                renderIcon={Term}
                iconDescription={translations('matchWholeWord')}
                hasIconOnly
              />
            </div>
          )}
        </div>
        <div className={styles.filterBtn}>
          <OverflowMenu
            size="lg"
            iconDescription={translations('filtersMenuTitle')}
            renderIcon={Filter}
            flipped={true}
          >
            <Checkbox
              id="checkbox-error"
              labelText={translations('filterError')}
              checked={filters.ERROR}
              onChange={() => handleFilterChange('ERROR')}
            />
            <Checkbox
              id="checkbox-warn"
              labelText={translations('filterWarn')}
              checked={filters.WARN}
              onChange={() => handleFilterChange('WARN')}
            />
            <Checkbox
              id="checkbox-info"
              labelText={translations('filterInfo')}
              checked={filters.INFO}
              onChange={() => handleFilterChange('INFO')}
            />
            <Checkbox
              id="checkbox-debug"
              labelText={translations('filterDebug')}
              checked={filters.DEBUG}
              onChange={() => handleFilterChange('DEBUG')}
            />
            <Checkbox
              id="checkbox-trace"
              labelText={translations('filterTrace')}
              checked={filters.TRACE}
              onChange={() => handleFilterChange('TRACE')}
            />
          </OverflowMenu>
        </div>
        <Button
          kind="ghost"
          renderIcon={CloudDownload}
          hasIconOnly
          iconDescription={translations('downloadButton')}
          onClick={() => handleDownload(logContent, 'run.log')}
        />
        <Button
          kind="ghost"
          renderIcon={Copy}
          hasIconOnly
          aria-label={copyPermalinkText}
          iconDescription={copyPermalinkText}
          onClick={selectedRange?.startLine ? handleCopyPermalink : undefined}
          className={!selectedRange?.startLine ? styles.buttonDisabled : ''}
          data-testid="icon-button-copy-permalink"
        />
      </div>
      <div className={styles.runLog}>
        <div className={styles.runLogContent} ref={logContainerRef}>
          {renderLogContent()}
        </div>
      </div>
    </div>
  );
}
