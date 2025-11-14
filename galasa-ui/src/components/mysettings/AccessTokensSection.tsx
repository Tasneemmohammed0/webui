/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { useEffect, useState } from 'react';
import { Loading, Button } from '@carbon/react';
import styles from '@/styles/mysettings/MySettings.module.css';
import TokenCard from '@/components/tokens/TokenCard';
import ErrorPage from '@/app/error/page';
import TokenRequestModal from '@/components/tokens/TokenRequestModal';
import TokenDeleteModal from '@/components/tokens/TokenDeleteModal';
import { AuthToken, AuthTokens } from '@/generated/galasaapi';
import { useTranslations } from 'next-intl';

interface AccessTokensSectionProps {
  accessTokensPromise: Promise<AuthTokens | undefined>;
  isAddBtnVisible: Boolean;
}

export default function AccessTokensSection({
  accessTokensPromise,
  isAddBtnVisible,
}: AccessTokensSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [tokens, setTokens] = useState<Set<AuthToken>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const selectTokenForDeletion = (tokenId: string) => {
    if (selectedTokens.has(tokenId)) {
      setSelectedTokens((prevSelectedTokens) => {
        const newSet = new Set(prevSelectedTokens);
        newSet.delete(tokenId);
        return newSet;
      });
    } else {
      setSelectedTokens((prevSelectedTokens) => {
        const newSet = new Set(prevSelectedTokens);
        newSet.add(tokenId);
        return newSet;
      });
    }
  };

  const updateDeleteModalState = () => {
    setIsDeleteModalOpen(false);
  };

  const deleteTokenFromSet = (token: AuthToken) => {
    setTokens((prevTokens) => {
      const newTokens = new Set(prevTokens);
      newTokens.delete(token);
      return newTokens;
    });

    setSelectedTokens((prevSelectedTokens) => {
      const newSelectedTokens = new Set(prevSelectedTokens);
      newSelectedTokens.delete(token.tokenId!);
      return newSelectedTokens;
    });

    setIsDeleteModalOpen(false);
  };

  useEffect(() => {
    const loadAccessTokens = async () => {
      setIsLoading(true);

      try {
        const accessTokens = await accessTokensPromise;
        if (accessTokens && accessTokens.tokens) {
          setTokens(new Set(accessTokens.tokens));
        } else {
          throw new Error(translations('error'));
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessTokens();

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [accessTokensPromise]);

  const translations = useTranslations('AccessTokensSection');
  return (
    <section className={styles.tokenContainer}>
      {isLoading ? (
        <Loading />
      ) : (
        !isError && (
          <>
            <h3 className={styles.title}>{translations('title')}</h3>

            <div className={styles.pageHeaderContainer}>
              <div>
                <p className={styles.heading}>{translations('descriptionline1')}</p>
                <p className={styles.heading}>{translations('descriptionline2')}</p>
              </div>
            </div>

            <div className={styles.btnContainer}>
              {/* // Only the user who is logged in can create a new token
            // Admins can only delete users' tokens.  */}
              {isAddBtnVisible && <TokenRequestModal isDisabled={selectedTokens.size > 0} />}

              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                className={styles.deleteBtn}
                disabled={selectedTokens.size === 0}
                kind="danger"
              >
                {translations('deleteButtontext', { count: selectedTokens.size })}
              </Button>
            </div>

            <div title="Access Tokens" className={styles.tokensList}>
              {Array.from(tokens).map((token) => (
                <TokenCard
                  key={token.tokenId}
                  token={token}
                  selectTokenForDeletion={selectTokenForDeletion}
                />
              ))}
            </div>

            {isDeleteModalOpen && (
              <TokenDeleteModal
                tokens={tokens}
                selectedTokens={selectedTokens}
                deleteTokenFromSet={deleteTokenFromSet}
                updateDeleteModalState={updateDeleteModalState}
              />
            )}
          </>
        )
      )}
      {isError && <ErrorPage />}
    </section>
  );
}
