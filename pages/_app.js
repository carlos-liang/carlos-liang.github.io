import "../styles/globals.css"
import "../styles/win98-scoped.css"
import Head from "next/head"
import Navbar from "../components/NavBar";

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Carlos Liang</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            </Head>
            <Navbar/>
            <Component {...pageProps} />
        </>
    )
}
