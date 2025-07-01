"use client";
/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import React, { useEffect, useState } from "react";
import styles from "@/styles/OverviewTab.module.css";
import InlineText from "./InlineText";
import { Tag } from "@carbon/react";
import { RunMetadata } from "@/utils/interfaces";
import { useTranslations } from "next-intl";
import { Link } from "@carbon/react";
import { Launch } from "@carbon/icons-react";
import { getOneMonthAgo, getAWeekBeforeSubmittedTime } from "@/utils/timeOperations";

const OverviewTab = ({ metadata }: { metadata: RunMetadata }) => {
  const tags = metadata?.tags || [];
  const translations = useTranslations("OverviewTab");
  const [weekBefore, setWeekBefore] = useState("");
  
  const MONTH_AGO = getOneMonthAgo();

  const OTHER_RECENT_RUNS = `/test-runs?testName=${metadata?.testName}&bundle=${metadata?.bundle}&group=${metadata?.group}&package=${metadata?.package}&from=${MONTH_AGO}`;
  const RETRIES_FOR_THIS_TEST_RUN = `/test-runs?submissionId=${metadata?.submissionId}&from=${weekBefore}`;

  useEffect(() => {

    const validateTime = () => {

      const validatedTime = getAWeekBeforeSubmittedTime(metadata?.rawSubmittedAt!);
      if (validatedTime === "Invalid date") {
        setWeekBefore("Invalid date");
      } else {
        setWeekBefore(validatedTime);
      }
      
    }

    validateTime();

  },[])

  return (
    <>
      <InlineText
        title={`${translations("bundle")}:`}
        value={metadata?.bundle} />
      <InlineText
        title={`${translations("test")}:`}
        value={metadata?.testName}
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
          <Link href={OTHER_RECENT_RUNS} renderIcon={Launch}>
            {translations("recentRunsLink")}
          </Link>

          {/* Only show the link if date is valid */}
          {
            weekBefore !== "Invalid date" && (
              <Link href={RETRIES_FOR_THIS_TEST_RUN} renderIcon={Launch}>
                {translations("runRetriesLink")}
              </Link>
            )
          }
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
