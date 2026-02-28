import "@/styles/globals.css";
import PasswordProtection from '../components/PasswordProtection';

export default function App({ Component, pageProps }) {
  return (
    <PasswordProtection>
      <Component {...pageProps} />
    </PasswordProtection>
  );
}
