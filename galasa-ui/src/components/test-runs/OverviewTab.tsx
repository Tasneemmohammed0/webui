/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/OverviewTab.module.css";
import InlineText from "./InlineText";
import { Tag } from "@carbon/react";
import { RunMetadata } from "@/utils/interfaces";
import { useTranslations } from "next-intl";
import { Link } from "@carbon/react";
import { Launch } from "@carbon/icons-react";
import { getOneMonthAgo, getAWeekBeforeSubmittedTime } from "@/utils/timeOperations";
import useHistoryBreadCrumbs from "@/hooks/useHistoryBreadCrumbs";
import { TEST_RUNS_QUERY_PARAMS } from "@/utils/constants/common";

const OverviewTab = ({ metadata }: { metadata: RunMetadata }) => {
  const tags = metadata?.tags || [];
  const translations = useTranslations("OverviewTab");
  const {pushBreadCrumb} = useHistoryBreadCrumbs();
  
  const [weekBefore, setWeekBefore] = useState<string | null>(null);
  
  const MONTH_AGO = getOneMonthAgo();

  const fullTestName = metadata?.package + "." + metadata?.testName;
  const OTHER_RECENT_RUNS = `/test-runs?${TEST_RUNS_QUERY_PARAMS.TEST_NAME}=${fullTestName}&${TEST_RUNS_QUERY_PARAMS.BUNDLE}=${metadata?.bundle}&${TEST_RUNS_QUERY_PARAMS.PACKAGE}=${metadata?.package}&${TEST_RUNS_QUERY_PARAMS.FROM}=${MONTH_AGO}&${TEST_RUNS_QUERY_PARAMS.TAB}=results`;
  const RETRIES_FOR_THIS_TEST_RUN = `/test-runs?${TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID}=${metadata?.submissionId}&${TEST_RUNS_QUERY_PARAMS.FROM}=${weekBefore}&${TEST_RUNS_QUERY_PARAMS.TAB}=results`;
  useEffect(() => {

    const validateTime = () => {

      const validatedTime = getAWeekBeforeSubmittedTime(metadata?.rawSubmittedAt!);
      if (validatedTime !== null) {
        setWeekBefore(validatedTime);
      }
      
    };

    validateTime();

  },[metadata?.rawSubmittedAt]);

  const handleNavigationClick = () => {
    // Push the current URL to the breadcrumb history
    pushBreadCrumb({
      title: `${metadata.runName}`,
      route: `/test-runs/${metadata.runId}`,
    });

  };

  return (
    <>
      <InlineText
        title={`${translations("bundle")}:`}
        value={metadata?.bundle} />
      <InlineText
        title={`${translations("testName")}:`}
        value={metadata?.testName}
      />
      <InlineText
        title={`${translations("testShortName")}:`}
        value={metadata?.testShortName}
      />
      <InlineText
        title={`${translations("package")}:`}
        value={metadata?.package}
      />
      <InlineText title={`${translations("group")}:`} value={metadata?.group} />
      <InlineText
        title={`${translations("submissionId")}:`}
        value={metadata?.submissionId}
      />
      <InlineText
        title={`${translations("requestor")}:`}
        value={metadata?.requestor}
      />

      <div className={styles.infoContainer}>
        <InlineText
          title={`${translations("submitted")}:`}
          value={metadata?.submitted}
        />
        <InlineText
          title={`${translations("started")}:`}
          value={metadata?.startedAt}
        />
        <InlineText
          title={`${translations("finished")}:`}
          value={metadata?.finishedAt}
        />
        <InlineText
          title={`${translations("duration")}:`}
          value={metadata?.duration}
        />
      </div>

      <div className={styles.tagsSection}>
        <h5>{translations("tags")}</h5>
        <div className={styles.tagsContainer}>
          {tags?.length > 0 ? (
            tags?.map((tag, index) => (
              <Tag size="md" key={index}>
                {tag}
              </Tag>
            ))
          ) : (
            <p>{translations("noTags")}</p>
          )}
        </div>

        <div className={styles.redirectLinks}>
          <div className={styles.linkWrapper} onClick={handleNavigationClick}>
            <Link href={OTHER_RECENT_RUNS} renderIcon={Launch} size="lg">
              {translations("recentRunsLink")}
            </Link>
          </div>
          {/* Only show the link if date is valid */}
          {
            weekBefore !== null && (
              <div className={styles.linkWrapper} onClick={handleNavigationClick}>
                <Link href={RETRIES_FOR_THIS_TEST_RUN} renderIcon={Launch} size="lg">
                  {translations("runRetriesLink")}
                </Link>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
