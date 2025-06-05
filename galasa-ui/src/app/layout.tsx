/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { getClientApiVersion, getServiceHealthStatus } from '@/utils/health';
import Footer from '@/components/Footer';
import PageHeader from '@/components/headers/PageHeader';
import '@/styles/global.scss';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const galasaServiceName = process.env.GALASA_SERVICE_NAME?.trim() || "Galasa Service";

  return (
    <html lang="en">
      <head>
        <title>{galasaServiceName}</title>
        <meta name="description" content="Galasa Ecosystem Web UI" />
      </head>
      <body>
        <FeatureFlagProvider>
            <PageHeader galasaServiceName={galasaServiceName} />
        {children}
        <Footer serviceHealthyPromise={getServiceHealthStatus()} clientVersionPromise={getClientApiVersion()}/>
        </FeatureFlagProvider>
      
      </body>
    </html>
  );
}
