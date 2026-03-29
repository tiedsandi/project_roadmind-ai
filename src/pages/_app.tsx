import "@/styles/globals.css";

import AppLayout from "@/components/AppLayout";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>RoadMind — AI Learning Platform</title>
        <meta name="description" content="Plan your learning journey with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </>
  );
}
