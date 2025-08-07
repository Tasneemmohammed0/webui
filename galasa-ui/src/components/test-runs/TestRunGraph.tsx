/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import '@carbon/charts/styles.css';
import { ScatterChart } from '@carbon/charts-react';
import { ScaleTypes, TimeIntervalNames } from '@carbon/charts';
import { InlineNotification } from '@carbon/react';
import { SkeletonText } from '@carbon/react';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import styles from '@/styles/TestRunsGraph.module.css';
import { runStructure, ColumnDefinition, DataPoint } from '@/utils/interfaces';
import { COLORS, MAX_DISPLAYABLE_TEST_RUNS } from '@/utils/constants/common';
import { TEST_RUNS } from '@/utils/constants/breadcrumb';
import useHistoryBreadCrumbs from '@/hooks/useHistoryBreadCrumbs';
import { useTheme } from '@/contexts/ThemeContext';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import { getTooltipHTML } from '../../utils/generateTooltipHTML';
import { useDisappearingNotification } from '@/hooks/useDisappearingNotification';

interface TestRunGraphProps {
  runsList: runStructure[];
  limitExceeded: boolean;
  visibleColumns?: string[];
  orderedHeaders?: ColumnDefinition[];
  isLoading?: boolean;
  isError?: boolean;
}
const resultColorMap: Record<string, string> = {
  passed: COLORS.GREEN,
  failed: COLORS.RED,
  envfail: COLORS.YELLOW,
  cancelled: COLORS.PURPLE,
  requeued: COLORS.CYAN,
  'n/a': COLORS.GRAY,
  other: COLORS.BLUE_GRAY,
};

export default function TestRunGraph({
  runsList,
  limitExceeded,
  visibleColumns = [],
  orderedHeaders = [],
  isLoading,
  isError,
}: TestRunGraphProps) {
  const translations = useTranslations('TestRunGraph');
  const themeContext = useTheme();
  const isLightTheme = themeContext?.theme === 'light';
  const { formatDate } = useDateTimeFormat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushBreadCrumb } = useHistoryBreadCrumbs();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const isNotificationVisible = useDisappearingNotification(limitExceeded);

  const headerDefinitions = useMemo(() => {
    if (!runsList.length) return [];
    const firstRun = runsList[0];
    return Object.keys(firstRun)
      .filter((key) => key !== 'id')
      .map((key) => ({
        key,
        header: translations(key),
        isDate: key === 'submittedAt',
      }));
  }, [runsList, translations]);

  const createChartDataPoint = (run: runStructure, dateMap: Record<string, number>) => {
    const date = new Date(run.submittedAt);
    const dateKey = date.toISOString().split('T')[0];
    const count = (dateMap[dateKey] || 0) + 1;
    dateMap[dateKey] = count;

    return {
      group: (run.result || 'other').toLowerCase(),
      date,
      value: count,
      custom: run,
    };
  };

  const chartData = useMemo(() => {
    const dateMap: Record<string, number> = {};
    return runsList.map((run) => createChartDataPoint(run, dateMap));
  }, [runsList]);

  const xTickValues = useMemo(
    () =>
      Array.from(
        new Set(runsList.map((run) => new Date(run.submittedAt).toISOString().split('T')[0]))
      ).map((d) => new Date(d)),
    [runsList]
  );

  let domain: [Date, Date] | undefined;
  const totalDates = xTickValues.length;

  if (totalDates === 1) {
    const timestamp = xTickValues[0].getTime();
    const offset = 12 * 60 * 60 * 1000;
    domain = [new Date(timestamp - offset), new Date(timestamp + offset)];
  } else {
    domain = undefined;
  }

  let pointRadius: number;
  const totalRuns = runsList.length;
  const maxRadius = 5;
  const minRadius = 1;
  const softLimit = 1000;

  if (totalRuns <= softLimit) {
    pointRadius = maxRadius - ((maxRadius - minRadius) * totalRuns) / softLimit;
  } else {
    pointRadius = minRadius;
  }

  const chartOptions = useMemo(() => {
    return {
      theme: isLightTheme ? 'white' : 'g100',
      axes: {
        bottom: {
          title: translations('submittedAt'),
          mapsTo: 'date',
          scaleType: ScaleTypes.TIME,
          ticks: {
            values: xTickValues,
            formatter: (tick: number | Date, i?: number) => {
              const date = tick instanceof Date ? tick : new Date(tick);
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'short' });

              let formattedDate;
              if (day === 1) {
                formattedDate = `${month} ${day}`;
              } else {
                formattedDate = `${day}`;
              }

              return formattedDate;
            },
          },
          domain: domain,
        },
        left: {
          title: '',
          mapsTo: 'value',
          scaleType: ScaleTypes.LINEAR,
          visible: false,
        },
      },
      timeScale: {
        showDayName: false,
        timeInterval: TimeIntervalNames.monthly,
        timeIntervalFormats: {
          monthly: {
            primary: 'MMM',
            secondary: 'd',
          },
        },
      },
      height: '400px',
      points: { radius: pointRadius, fillOpacity: 1 },
      color: { scale: resultColorMap },
      zoomBar: {
        top: {
          enabled: true,
        },
      },
      animations: false,
      tooltip: {
        enabled: true,
        customHTML: (points: DataPoint[]) => getTooltipHTML(points, headerDefinitions, formatDate),
      },
      legend: { alignment: 'center' },
      data: { loading: isLoading },
      toolbar: { enabled: false },
      experimental: true,
    };
  }, [headerDefinitions, isLoading, isLightTheme, translations, xTickValues]);

  type DataBoundElement = HTMLElement & { __data__?: DataPoint };

  // Carbon Charts does not expose a direct onClick handler for data points.
  // Therefore, we manually attach a click event listener to the chart container.
  // The handler traverses the DOM from the event target upwards to find an element with a __data__ property,
  // which contains the chart's data point object. This allows us to extract the clicked run and perform navigation.
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      let element = event.target as HTMLElement | null;

      while (element && !(element as DataBoundElement).__data__) {
        element = element.parentElement;
      }
      const dataPoint = element && (element as DataBoundElement)?.__data__;
      let selectedRun: runStructure | undefined;
      if (dataPoint?.custom) {
        selectedRun = dataPoint.custom as runStructure;
      }
      if (selectedRun?.id) {
        pushBreadCrumb({
          ...TEST_RUNS,
          route: `/test-runs?${searchParams.toString()}`,
        });
        router.push(`/test-runs/${selectedRun.id}`);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [chartData, pushBreadCrumb, router, searchParams]);

  if (isError) {
    return <p>{translations('errorLoadingGraph')}</p>;
  }
  if (isLoading) {
    return <SkeletonText className={styles.spinnerWrapper} />;
  }
  if (!runsList.length) {
    return <p>{translations('noTestRunsFound')}</p>;
  }
  const dates = runsList.map((run) => new Date(run.submittedAt || 0).getTime());

  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));

  return (
    <div className={styles.resultsPageContainer}>
      {limitExceeded && isNotificationVisible && (
        <InlineNotification
          kind="warning"
          title={translations('limitExceeded.title')}
          subtitle={translations('limitExceeded.subtitle', {
            maxRecords: MAX_DISPLAYABLE_TEST_RUNS,
          })}
          className={styles.notification}
        />
      )}
      <p className={styles.timeFrameText}>
        {translations('timeFrameText.range', {
          from: formatDate(earliestDate),
          to: formatDate(latestDate),
        })}
      </p>
      <div ref={chartContainerRef}>
        <ScatterChart data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
