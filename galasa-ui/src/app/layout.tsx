/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { getClientApiVersion, getServiceHealthStatus } from '@/utils/health';
import { NextIntlClientProvider } from 'next-intl';
import Footer from '@/components/Footer';
import PageHeader from '@/components/headers/PageHeader';
import '@/styles/global.scss';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { cookies } from 'next/headers';
import FeatureFlagCookies from '@/utils/featureFlagCookies';
import { getLocale } from 'next-intl/server';
import ReactQueryProvider from '@/contexts/ReactQueryProvider';

export const dynamic = "force-dynamic";

export default async function RootLayout({children,}: {children: React.ReactNode}) {
  // Ensure that the incoming `locale` is valid
  const locale = await getLocale();
 
  const galasaServiceName = process.env.GALASA_SERVICE_NAME?.trim() || "Galasa Service";
  const featureFlagsCookie = cookies().get(FeatureFlagCookies.FEATURE_FLAGS)?.value;

  return (
    <html lang={locale}>
      <head>
        <title>{galasaServiceName}</title>
        <meta name="description" content="Galasa Ecosystem Web UI" />
      </head>
      <body>
        <NextIntlClientProvider>
          <FeatureFlagProvider initialFlags={featureFlagsCookie}>
            <PageHeader galasaServiceName={galasaServiceName} />
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
            <Footer serviceHealthyPromise={getServiceHealthStatus()} clientVersionPromise={getClientApiVersion()}/>
          </FeatureFlagProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

