"use client"
import React from 'react';
import { QueryClient , QueryClientProvider } from '@tanstack/react-query';

type TProviderProps = {
    children: React.ReactNode;
}

const Provider = ({children}: TProviderProps) => {
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions:{
            queries:{
                refetchOnWindowFocus:false,
                retry:false,
                gcTime:1000 * 60 * 15,  
            }
        }
    }))
  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  )
}

export default Provider
