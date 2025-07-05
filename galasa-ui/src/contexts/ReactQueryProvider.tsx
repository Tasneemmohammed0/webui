/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';


import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
   const [queryClient] = useState(() => new QueryClient());

   return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
   );
};
