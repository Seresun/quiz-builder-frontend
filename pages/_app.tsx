import Head from 'next/head';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

const FAVICON_DATA_URL =
  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 256 256%22><rect width=%22256%22 height=%22256%22 rx=%2248%22 fill=%22%230256b5%22/><path fill=%22white%22 d=%22M72 176v-96h48c29.6 0 48 18.4 48 48s-18.4 48-48 48Zm32-72v48h16c10.56 0 16-5.44 16-24s-5.44-24-16-24Z%22/></svg>';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href={FAVICON_DATA_URL} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

