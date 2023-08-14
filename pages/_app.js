import "../styles/globals.css"
import Head from "next/head"
import Navbar from "../components/NavBar";

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Carlos Liang</title>
            </Head>
            <Navbar/>
            <Component {...pageProps} />
        </>
    )
}
