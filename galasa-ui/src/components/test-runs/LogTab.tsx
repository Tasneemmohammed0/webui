/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Search, OverflowMenu, Button } from '@carbon/react';
import styles from "@/styles/LogTab.module.css";
import { Checkbox } from "@carbon/react";
import {
  Filter,
  ChevronUp,
  ChevronDown,
  CloudDownload,
  Term,
  LetterAa,
} from "@carbon/icons-react";
import { handleDownload } from "@/utils/artifacts";
import { useTranslations } from "next-intl";

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
  AllMatches = "g",
  AllMatchesIgnoreCase = "gi",
}

interface LogTabProps {
  logs: string;
  initialLine?: number;
}

export default function LogTab({ logs, initialLine }: LogTabProps) {
  const translations = useTranslations("LogTab");

  const [logContent, setLogContent] = useState<string>("");
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

  // Cache for search results to avoid recomputation
  const [searchCache, setSearchCache] = useState<Map<string, MatchInfo[]>>(new Map());

  const logContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY_MILLISECONDS = 300;

  const handleSearchChange = (e: any) => {
    const value = e.target?.value || "";
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
    const tokens = line.trim().split(" ");
    if (
      tokens.length >= 3 &&
      tokens[0].length === 10 && // Simple check for DD/MM/YYYY format
      tokens[0].charAt(2) === "/" &&
      tokens[0].charAt(5) === "/" &&
      tokens[1].includes(":") &&
      tokens[1].includes(".")
    ) {
      if (["ERROR", "WARN", "DEBUG", "INFO", "TRACE"].includes(tokens[2])) {
        logLevel = tokens[2];
      }
    }

    // Fallback: check if the line starts with any log level
    if (!logLevel) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("ERROR")) {
        logLevel = "ERROR";
      } else if (trimmedLine.startsWith("WARN")) {
        logLevel = "WARN";
      } else if (trimmedLine.startsWith("DEBUG")) {
        logLevel = "DEBUG";
      } else if (trimmedLine.startsWith("INFO")) {
        logLevel = "INFO";
      } else if (trimmedLine.startsWith("TRACE")) {
        logLevel = "TRACE";
      }
    }

    return logLevel;
  };

  // Search function that computes all matches once and caches results
  const computeSearchMatches = useCallback((lines: LogLine[], regex: RegExp | null): MatchInfo[] => {
    let result: MatchInfo[] = [];

    if (!regex || !debouncedSearchTerm.trim()) {
      result = [];
    } else {
      try {
        // Create cache key
        const cacheKey = `${debouncedSearchTerm}-${matchCase}-${matchWholeWord}-${lines.map(l => l.isVisible).join('')}`;

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
                globalIndex: globalIndex++
              });

              // Prevent infinite loop on zero-length matches
              if (match.index === regex.lastIndex) {
                regex.lastIndex++;
              }
            }
          });

          // Cache the results
          setSearchCache(prev => new Map(prev).set(cacheKey, matches));
          result = matches;
        }
      } catch (error) {

        console.warn('Regex execution error:', error);
        result = [];

      }
    }

    return result;
  }, [debouncedSearchTerm, matchCase, matchWholeWord, searchCache]);

  const searchMatches = useMemo(() => {
    return computeSearchMatches(processedLines, searchRegex);
  }, [processedLines, searchRegex, computeSearchMatches]);

  const highlightText = useCallback((text: string, lineIndex: number): React.ReactNode => {
    let result: React.ReactNode = text;

    if (searchRegex && debouncedSearchTerm.trim()) {
      const lineMatches = searchMatches.filter(match => match.lineIndex === lineIndex);

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
  }, [searchRegex, debouncedSearchTerm, searchMatches, currentMatchIndex]);

  const visibleLines = useMemo(() => {
    return processedLines.filter(line => line.isVisible);
  }, [processedLines]);

  const renderLogContent = () => {
    let result: JSX.Element[] | null = null;

    if (visibleLines.length === 0) {
      result = null;
    } else {
      result = visibleLines.map((logLine) => {
        const levelClass = logLine.level.toLowerCase();
        const colorClass = styles[levelClass as keyof typeof styles] || "";

        return (
          <div
            key={logLine.lineNumber}
            id={`log-line-${logLine.lineNumber}`}
            className={`${colorClass} ${styles.logEntry}`}
          >
            <span className={styles.lineNumberCol}>
              {logLine.lineNumber}.
            </span>
            <pre>{highlightText(logLine.content, processedLines.indexOf(logLine))}</pre>
          </div>
        );
      });
    }

    return result;
  };

  // Effect to scroll to the initial line
  useEffect(() => {
    if (initialLine && processedLines.length > 0) {
      const lineElement = document.getElementById(`log-line-${initialLine - 1}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [initialLine, processedLines]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchIndex >= 0) {
      const currentMatchElement = document.getElementById("current-match");
      if (currentMatchElement) {
        currentMatchElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
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
      const lines = content.split("\n");
      const processed: LogLine[] = [];
      let currentLevel = "INFO"; // Default level
  
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
      const hasActiveFilters = Object.values(filters).some(
        (filter) => filter === true,
      );
  
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

  return (
    <div className={styles.tabContent}>
      <h3>{translations("title")}</h3>
      <p>{translations("description")}</p>
      <div className={styles.logContainer}>
        <div className={styles.searchContainer}>
          <Search
            placeholder={translations("search_placeholder")}
            size="lg"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {debouncedSearchTerm && (
            <div className={styles.findControls}>
              <span className={styles.matchCounter} data-testid="match-counter">
                {totalMatches > 0
                  ? translations("match_counter", {
                    current: currentMatchIndex + 1,
                    total: totalMatches,
                  })
                  : translations("no_matches")}
              </span>
              <Button
                kind="ghost"
                size="sm"
                onClick={goToPreviousMatch}
                disabled={totalMatches === 0}
                renderIcon={ChevronUp}
                iconDescription={translations("match_previous")}
                hasIconOnly
              />
              <Button
                kind="ghost"
                size="sm"
                onClick={goToNextMatch}
                disabled={totalMatches === 0}
                renderIcon={ChevronDown}
                iconDescription={translations("match_next")}
                hasIconOnly
              />
              <Button
                kind={matchCase ? "primary" : "ghost"}
                size="sm"
                onClick={toggleMatchCase}
                renderIcon={LetterAa}
                iconDescription={translations("match_case")}
                hasIconOnly
              />
              <Button
                kind={matchWholeWord ? "primary" : "ghost"}
                size="sm"
                onClick={toggleMatchWholeWord}
                renderIcon={Term}
                iconDescription={translations("match_whole_word")}
                hasIconOnly
              />
            </div>
          )}
        </div>
        <div className={styles.filterBtn}>
          <OverflowMenu
            size="lg"
            iconDescription={translations("filters_menu_title")}
            renderIcon={Filter}
            flipped={true}
          >
            <Checkbox
              id="checkbox-error"
              labelText={translations("filter_error")}
              checked={filters.ERROR}
              onChange={() => handleFilterChange("ERROR")}
            />
            <Checkbox
              id="checkbox-warn"
              labelText={translations("filter_warn")}
              checked={filters.WARN}
              onChange={() => handleFilterChange("WARN")}
            />
            <Checkbox
              id="checkbox-info"
              labelText={translations("filter_info")}
              checked={filters.INFO}
              onChange={() => handleFilterChange("INFO")}
            />
            <Checkbox
              id="checkbox-debug"
              labelText={translations("filter_debug")}
              checked={filters.DEBUG}
              onChange={() => handleFilterChange("DEBUG")}
            />
            <Checkbox
              id="checkbox-trace"
              labelText={translations("filter_trace")}
              checked={filters.TRACE}
              onChange={() => handleFilterChange("TRACE")}
            />
          </OverflowMenu>
        </div>
        <Button
          kind="ghost"
          renderIcon={CloudDownload}
          hasIconOnly
          iconDescription={translations("download_button")}
          onClick={() => handleDownload(logContent, "run.log")}
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
